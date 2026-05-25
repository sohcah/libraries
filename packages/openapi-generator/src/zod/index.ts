import { writeFile } from "node:fs/promises";
import {
  JsSchemaGeneratorExtension,
  type JsDocument,
  type OpenApiJsSchemaGenerator,
} from "../js/index.js";
import {
  type OpenApiGenerator,
  type ApiDocument,
  type OperationReference,
  type SchemaReferenceType,
  dereferenceSchema,
  type SchemaObject,
  dereference,
  type MediaTypeObject,
} from "../core.js";
import * as t from "@babel/types";
import { generate } from "@babel/generator";
import { getOperationKey } from "../helpers.js";
import { generatePathExpression } from "../js/generatePathExpression.js";
import { createAppendStatement } from "./appendStatement.js";
import {
  stringLiteralOrIdentifier,
  stringMemberExpression,
} from "../js/stringLiteralOrIdentifier.js";
import { ensureImport, relativeImportPath } from "../js/ensureImport.js";

function getIdentifierSafeOperationKey(ref: OperationReference): string {
  return getOperationKey(ref).replace(/[^a-zA-Z0-9]/g, "__");
}

function comment<T extends t.Node>(comment: string | null | undefined, node: T) {
  if (!comment) return node;
  return t.addComment(node, "leading", comment);
}

export type ZodSchemaOverride = {
  type: "import";
  name: string;
  from: string;
};

export interface ZodGeneratorOptions {
  output: string;

  /** @default false */
  includeTypeAnnotations?: boolean;

  overrideSchema?: (schema: SchemaObject) => ZodSchemaOverride | null;
  overrideFormats?: Record<string, ZodSchemaOverride>;
}

interface ZodSchemaMeta {
  isObject?: boolean;
  discriminatedBase?: boolean;
}

interface ZodSchema {
  schema: t.Expression;
  type: t.TSType;
  meta?: ZodSchemaMeta;
}

interface ZodSchemaContext {
  base?: boolean;
}

function omit<T extends object>(obj: T, keys: string[]): T {
  return Object.fromEntries(Object.entries(obj).filter(([key]) => !keys.includes(key))) as T;
}

interface ZodBodyOption {
  hasContentType: boolean;
}

export class ZodGenerator implements OpenApiGenerator, OpenApiJsSchemaGenerator {
  #options: ZodGeneratorOptions;
  #imports: t.ImportDeclaration[];
  #header: t.Statement[];
  #schemas: Map<string, { statements: t.Statement[]; meta: ZodSchemaMeta }>;
  #operations: t.Statement[];
  constructor(options: ZodGeneratorOptions) {
    this.#options = options;
    this.#imports = [
      t.importDeclaration([t.importDefaultSpecifier(t.identifier("z"))], t.stringLiteral("zod")),
    ];
    this.#header = [];
    this.#schemas = new Map();
    this.#operations = [];
  }

  #hasParametersSchema = false;
  #ensureParametersSchema(): t.Expression {
    if (!this.#hasParametersSchema) {
      this.#hasParametersSchema = true;
      this.#header.push(
        t.variableDeclaration("const", [
          t.variableDeclarator(
            t.identifier("ParametersSchema"),
            t.callExpression(t.memberExpression(t.identifier("z"), t.identifier("object")), [
              t.objectExpression([
                t.objectProperty(t.identifier("path"), this.#z("string", [])),
                t.objectProperty(t.identifier("method"), this.#z("string", [])),
                t.objectProperty(
                  t.identifier("headers"),
                  this.#z("optional", [this.#z("instanceof", [t.identifier("Headers")])], true),
                ),
                t.objectProperty(
                  t.identifier("body"),
                  this.#z(
                    "optional",
                    [
                      this.#z("union", [
                        t.arrayExpression([
                          this.#z("string", []),
                          this.#z("instanceof", [t.identifier("Blob")]),
                          this.#z("instanceof", [t.identifier("FormData")]),
                          this.#z("instanceof", [t.identifier("URLSearchParams")]),
                        ]),
                      ]),
                    ],
                    true,
                  ),
                ),
              ]),
            ]),
          ),
        ]),
      );
    }
    return t.identifier("ParametersSchema");
  }

  #hasNotImplementedFunction = false;
  #ensureNotImplementedFunction(): t.Expression {
    if (!this.#hasNotImplementedFunction) {
      this.#hasNotImplementedFunction = true;
      this.#header.push(
        t.variableDeclaration("const", [
          t.variableDeclarator(
            t.identifier("notImplemented"),
            t.arrowFunctionExpression(
              [],
              t.blockStatement([
                t.throwStatement(
                  t.newExpression(t.identifier("Error"), [t.stringLiteral("Not implemented")]),
                ),
              ]),
            ),
          ),
        ]),
      );
    }
    return t.identifier("notImplemented");
  }

  #hasBlobResponseCodec = false;
  #ensureBlobResponseCodec(): t.Expression {
    if (!this.#hasBlobResponseCodec) {
      this.#hasBlobResponseCodec = true;
      this.#header.push(
        t.variableDeclaration("const", [
          t.variableDeclarator(
            t.identifier("blobResponseCodec"),
            this.#createCodec(
              this.#z("instanceof", [t.identifier("Response")]),
              this.#z("instanceof", [t.identifier("Blob")]),
              t.arrowFunctionExpression(
                [t.identifier("value")],
                t.blockStatement([
                  t.returnStatement(
                    t.awaitExpression(
                      t.callExpression(
                        t.memberExpression(t.identifier("value"), t.identifier("blob")),
                        [],
                      ),
                    ),
                  ),
                ]),
                true,
              ),
              this.#ensureNotImplementedFunction(),
            ),
          ),
        ]),
      );
    }
    return t.identifier("blobResponseCodec");
  }

  #hasJsonResponseCodec = false;
  #ensureJsonResponseCodec(): t.Expression {
    if (!this.#hasJsonResponseCodec) {
      this.#hasJsonResponseCodec = true;
      const decode = t.arrowFunctionExpression(
        [t.identifier("response"), t.identifier("ctx")],
        t.blockStatement([
          t.tryStatement(
            t.blockStatement([
              t.returnStatement(
                t.awaitExpression(
                  t.callExpression(
                    t.memberExpression(t.identifier("response"), t.identifier("json")),
                    [],
                  ),
                ),
              ),
            ]),
            t.catchClause(
              Object.assign(t.identifier("error"), {
                typeAnnotation: t.tsTypeAnnotation(t.tsUnknownKeyword()),
              }),
              t.blockStatement([
                t.expressionStatement(
                  t.callExpression(
                    t.memberExpression(
                      t.memberExpression(t.identifier("ctx"), t.identifier("issues")),
                      t.identifier("push"),
                    ),
                    [
                      t.objectExpression([
                        t.objectProperty(t.identifier("code"), t.stringLiteral("custom")),
                        t.objectProperty(t.identifier("input"), t.identifier("response")),
                        t.objectProperty(
                          t.identifier("message"),
                          t.memberExpression(
                            t.tsAsExpression(
                              t.identifier("error"),
                              t.tsTypeReference(t.identifier("Error")),
                            ),
                            t.identifier("message"),
                          ),
                        ),
                      ]),
                    ],
                  ),
                ),
                t.returnStatement(t.memberExpression(t.identifier("z"), t.identifier("NEVER"))),
              ]),
            ),
          ),
        ]),
        true,
      );
      decode.returnType = t.tsTypeAnnotation(
        t.tsTypeReference(
          t.identifier("Promise"),
          t.tsTypeParameterInstantiation([t.tsUnknownKeyword()]),
        ),
      );
      this.#header.push(
        t.variableDeclaration("const", [
          t.variableDeclarator(
            t.identifier("jsonResponseCodec"),
            this.#createCodec(
              this.#z("instanceof", [t.identifier("Response")]),
              this.#z("unknown", []),
              decode,
              this.#ensureNotImplementedFunction(),
            ),
          ),
        ]),
      );
    }
    return t.identifier("jsonResponseCodec");
  }

  #hasJsonContentEncodeFunction = false;
  #ensureJsonContentEncodeFunction(): t.Expression {
    if (!this.#hasJsonContentEncodeFunction) {
      this.#hasJsonContentEncodeFunction = true;
      this.#header.push(
        t.variableDeclaration("const", [
          t.variableDeclarator(
            t.identifier("jsonContentEncode"),
            t.arrowFunctionExpression(
              [
                Object.assign(t.identifier("value"), {
                  typeAnnotation: t.tsTypeAnnotation(t.tsUnknownKeyword()),
                }),
              ],
              t.blockStatement([
                t.returnStatement(
                  t.objectExpression([
                    t.objectProperty(
                      t.identifier("contentType"),
                      t.stringLiteral("application/json"),
                    ),
                    t.objectProperty(
                      t.identifier("content"),
                      t.callExpression(t.identifier("JSON.stringify"), [t.identifier("value")]),
                    ),
                  ]),
                ),
              ]),
            ),
          ),
        ]),
      );
    }
    return t.identifier("jsonContentEncode");
  }

  #createCodec(
    inExpression: t.Expression,
    outExpression: t.Expression,
    decode: t.Expression,
    encode: t.Expression,
  ): t.Expression {
    return t.callExpression(t.memberExpression(t.identifier("z"), t.identifier("codec")), [
      inExpression,
      outExpression,
      t.objectExpression([
        t.objectProperty(t.identifier("decode"), decode),
        t.objectProperty(t.identifier("encode"), encode),
      ]),
    ]);
  }

  #zSchemaType(inType: t.TSType, outType: t.TSType = inType): t.TSType {
    return t.tsTypeReference(
      t.tsQualifiedName(t.identifier("z"), t.identifier("Schema")),
      t.tsTypeParameterInstantiation([inType, outType]),
    );
  }

  #zResolvedType(variant: "input" | "output", type: t.TSType): t.TSType {
    // If type is a z.Schema<In, Out>, return the In or Out directly rather than z.variant<z.Schema<In, Out>>
    if (
      t.isTSTypeReference(type) &&
      t.isTSQualifiedName(type.typeName) &&
      t.isIdentifier(type.typeName.left) &&
      type.typeName.left.name === "z" &&
      t.isIdentifier(type.typeName.right) &&
      type.typeName.right.name === "Schema" &&
      type.typeParameters &&
      type.typeParameters.params.length === 2
    ) {
      return type.typeParameters.params[variant === "input" ? 0 : 1]!;
    }

    return t.tsTypeReference(
      t.tsQualifiedName(t.identifier("z"), t.identifier(variant)),
      t.tsTypeParameterInstantiation([type]),
    );
  }

  #zObjectShape(object: t.Expression): t.Expression {
    // If object is a z.object(...), return the ... directly rather than z.object(...).shape
    if (
      t.isCallExpression(object) &&
      t.isMemberExpression(object.callee) &&
      t.isIdentifier(object.callee.object) &&
      object.callee.object.name === "z" &&
      t.isIdentifier(object.callee.property) &&
      object.callee.property.name === "object" &&
      object.arguments.length === 1 &&
      object.arguments[0]?.type === "ObjectExpression"
    ) {
      return object.arguments[0];
    }
    return t.memberExpression(object, t.identifier("shape"));
  }

  #z(
    name: string,
    args: t.Expression[],
    chain?: boolean,
    typeParameters?: t.TSTypeParameterInstantiation,
  ): t.Expression {
    const call = chain
      ? t.callExpression(t.memberExpression(args[0]!, t.identifier(name)), args.slice(1))
      : t.callExpression(t.memberExpression(t.identifier("z"), t.identifier(name)), args);
    call.typeParameters = typeParameters;
    return call;
  }

  #literal(value: unknown): t.StringLiteral | t.NumericLiteral | t.BooleanLiteral {
    if (typeof value === "string") {
      return t.stringLiteral(value);
    }
    if (typeof value === "number") {
      return t.numericLiteral(value);
    }
    if (typeof value === "boolean") {
      return t.booleanLiteral(value);
    }
    throw new Error(`Unsupported literal value: ${JSON.stringify(value)}`);
  }

  #getZodObjectSchema(
    document: ApiDocument,
    schema: Extract<SchemaObject, { type: "object" }>,
    ctx: ZodSchemaContext,
  ): ZodSchema {
    const object = t.objectExpression([]);
    const objectTypeInput = t.tsTypeLiteral([]);
    const objectTypeOutput = t.tsTypeLiteral([]);

    // Properties
    for (const [propertyKey, property] of Object.entries(schema.properties ?? {})) {
      const optional = !(schema.required?.includes(propertyKey) ?? false);
      const propertySchema = this.#getZodSchema(document, property, {});
      object.properties.push(
        t.objectProperty(
          stringLiteralOrIdentifier(propertyKey),
          optional ? this.#z("optional", [propertySchema.schema], true) : propertySchema.schema,
        ),
      );
      objectTypeInput.members.push(
        Object.assign(
          t.tsPropertySignature(
            stringLiteralOrIdentifier(propertyKey),
            t.tsTypeAnnotation(this.#zResolvedType("input", propertySchema.type)),
          ),
          { optional },
        ),
      );
      objectTypeOutput.members.push(
        Object.assign(
          t.tsPropertySignature(
            stringLiteralOrIdentifier(propertyKey),
            t.tsTypeAnnotation(this.#zResolvedType("output", propertySchema.type)),
          ),
          { optional },
        ),
      );
    }

    // Additional Properties
    if (schema.additionalProperties) {
      const valueSchema = this.#getZodSchema(
        document,
        schema.additionalProperties === true ? ({} as SchemaObject) : schema.additionalProperties,
        {},
      );

      // When *only* additional properties, use z.record
      if (object.properties.length === 0) {
        return {
          schema: this.#z("record", [this.#z("string", []), valueSchema.schema]),
          type: this.#zSchemaType(
            t.tsTypeReference(
              t.identifier("Record"),
              t.tsTypeParameterInstantiation([
                t.tsStringKeyword(),
                this.#zResolvedType("input", valueSchema.type),
              ]),
            ),
            t.tsTypeReference(
              t.identifier("Record"),
              t.tsTypeParameterInstantiation([
                t.tsStringKeyword(),
                this.#zResolvedType("output", valueSchema.type),
              ]),
            ),
          ),
        };
      }

      // Otherwise, use z.catchall
      const keyParam = t.identifier("key");
      keyParam.typeAnnotation = t.tsTypeAnnotation(t.tsStringKeyword());
      return {
        schema: this.#z("catchall", [this.#z("object", [object]), valueSchema.schema], true),
        type: this.#zSchemaType(
          t.tsTypeLiteral([
            ...objectTypeInput.members,
            t.tsIndexSignature(
              [keyParam],
              t.tsTypeAnnotation(this.#zResolvedType("input", valueSchema.type)),
            ),
          ]),
          t.tsTypeLiteral([
            ...objectTypeOutput.members,
            t.tsIndexSignature(
              [keyParam],
              t.tsTypeAnnotation(this.#zResolvedType("output", valueSchema.type)),
            ),
          ]),
        ),
      };
    }

    // Otherwise, use z.object
    return {
      schema: this.#z("object", [object]),
      type: this.#zSchemaType(objectTypeInput, objectTypeOutput),
      meta: {
        isObject: true,
      },
    };
  }

  #getZodArraySchema(
    document: ApiDocument,
    schema: Extract<SchemaObject, { type: "array" }>,
    ctx: ZodSchemaContext,
  ): ZodSchema {
    const itemSchema = this.#getZodSchema(document, schema.items ?? ({} as SchemaObject), {});
    return {
      schema: this.#z("array", [itemSchema.schema]),
      type: this.#zSchemaType(
        t.tsArrayType(this.#zResolvedType("input", itemSchema.type)),
        t.tsArrayType(this.#zResolvedType("output", itemSchema.type)),
      ),
    };
  }

  #getZodSchemaBase(
    document: ApiDocument,
    schema: SchemaReferenceType,
    ctx: ZodSchemaContext,
  ): ZodSchema {
    if ("$ref" in schema) {
      const schemaKey = schema.$ref.split("/").pop()!;
      const trySuffixes = ["", ...(ctx.base ? ["_Base"] : [])];

      if (!trySuffixes.some((suffix) => this.#schemas.has(schema.$ref + suffix))) {
        const zodSchema = this.#getZodSchema(document, dereferenceSchema(schema), ctx);
        const suffix = zodSchema.meta?.discriminatedBase ? "_Base" : "";
        const identifier = t.identifier(schemaKey + suffix);
        if (this.#options.includeTypeAnnotations) {
          identifier.typeAnnotation = t.tsTypeAnnotation(zodSchema.type);
        }
        this.#schemas.set(schema.$ref + suffix, {
          statements: [
            t.exportNamedDeclaration(
              t.variableDeclaration("const", [t.variableDeclarator(identifier, zodSchema.schema)]),
            ),
            t.exportNamedDeclaration(
              t.tsTypeAliasDeclaration(
                identifier,
                null,
                this.#zResolvedType("output", t.tsTypeQuery(identifier)),
              ),
            ),
          ],
          meta: zodSchema.meta ?? {},
        });
      }

      for (const suffix of trySuffixes) {
        const identifier = t.identifier(schemaKey + suffix);
        if (this.#schemas.has(schema.$ref + suffix)) {
          return {
            schema: identifier,
            type: t.tsTypeQuery(identifier),
            meta: this.#schemas.get(schema.$ref + suffix)!.meta,
          };
        }
      }
      throw new Error(`Schema ${schema.$ref} not found`);
    }

    if (schema.allOf) {
      const schemas = schema.allOf.flatMap((s) =>
        this.#getZodSchema(document, s, { base: schema.allOf!.length > 1 }),
      );
      const isObject = schemas.every((i) => i.meta?.isObject);
      const outputSchema = isObject
        ? schemas
            .map((s) => s.schema)
            .reduce((a, b) => this.#z("extend", [a, this.#zObjectShape(b)], true))
        : schemas.map((s) => s.schema).reduce((a, b) => this.#z("intersection", [a, b]));
      return {
        schema: outputSchema,
        type: this.#zSchemaType(
          t.tsIntersectionType(schemas.map((s) => this.#zResolvedType("input", s.type))),
          t.tsIntersectionType(schemas.map((s) => this.#zResolvedType("output", s.type))),
        ),
        meta: {
          isObject,
        },
      };
    }

    if (
      schema.discriminator?.propertyName &&
      schema.discriminator.mapping &&
      "type" in schema &&
      schema.type === "object"
    ) {
      if (ctx.base) {
        const baseSchema = this.#getZodObjectSchema(document, schema, ctx);
        return {
          ...baseSchema,
          meta: {
            ...(baseSchema.meta ?? {}),
            discriminatedBase: true,
          },
        };
      }

      const schemas = Object.entries(schema.discriminator.mapping).map(
        ([discriminatorKey, discriminatedSchemaRef]): ZodSchema => {
          if (!discriminatedSchemaRef.startsWith("#/components/schemas/")) {
            throw new Error(`Invalid discriminator schema reference: ${discriminatedSchemaRef}`);
          }
          const discriminatedSchema =
            document.components?.schemas?.[discriminatedSchemaRef.slice(21)];
          if (!discriminatedSchema) {
            throw new Error(`Discriminator schema not found: ${discriminatedSchemaRef}`);
          }
          return this.#getZodSchema(
            document,
            {
              allOf: [
                {
                  $ref: discriminatedSchemaRef,
                  "$ref-value": dereferenceSchema(discriminatedSchema),
                },
                {
                  type: "object",
                  properties: {
                    [schema.discriminator!.propertyName]: {
                      const: discriminatorKey,
                    },
                  },
                  required: [schema.discriminator!.propertyName],
                },
              ],
            } as SchemaObject,
            {},
          );
        },
      );
      const useDiscrimination = schemas.every((s) => s.meta?.isObject);
      const unionSchema = this.#z(useDiscrimination ? "discriminatedUnion" : "union", [
        ...(useDiscrimination ? [t.stringLiteral(schema.discriminator.propertyName)] : []),
        t.arrayExpression(schemas.map((s) => s.schema)),
      ]);
      const unionTypeIn = t.tsUnionType(schemas.map((s) => this.#zResolvedType("input", s.type)));
      const unionTypeOut = t.tsUnionType(schemas.map((s) => this.#zResolvedType("output", s.type)));

      if ("x-sohcah-extensible-union" in schema && schema["x-sohcah-extensible-union"]) {
        return {
          schema: this.#z("union", [
            t.arrayExpression([
              unionSchema,
              this.#z("object", [
                t.objectExpression([
                  t.objectProperty(
                    stringLiteralOrIdentifier(schema.discriminator.propertyName),
                    this.#z(
                      "transform",
                      [
                        this.#z(
                          "refine",
                          [
                            this.#z("string", []),
                            t.arrowFunctionExpression(
                              [t.identifier("type")],
                              Object.keys(schema.discriminator.mapping)
                                .map(
                                  (i): t.Expression =>
                                    t.binaryExpression(
                                      "!==",
                                      t.identifier("type"),
                                      t.stringLiteral(i),
                                    ),
                                )
                                .reduce((a, b) => t.logicalExpression("&&", a, b)),
                            ),
                          ],
                          true,
                        ),
                        t.arrowFunctionExpression(
                          [],
                          t.tsAsExpression(
                            t.stringLiteral("unknown"),
                            t.tsTypeReference(t.identifier("const")),
                          ),
                        ),
                      ],
                      true,
                    ),
                  ),
                ]),
              ]),
            ]),
          ]),
          type: this.#zSchemaType(
            t.tsUnionType([unionTypeIn, t.tsLiteralType(t.stringLiteral("unknown"))]),
            t.tsUnionType([unionTypeOut, t.tsLiteralType(t.stringLiteral("unknown"))]),
          ),
        };
      }

      return {
        schema: unionSchema,
        type: this.#zSchemaType(unionTypeIn, unionTypeOut),
      };
    }

    const anyOrOneOf = schema.oneOf || schema.anyOf;
    if (anyOrOneOf) {
      const schemas = anyOrOneOf.map((s) => this.#getZodSchema(document, s, ctx));
      return {
        schema: this.#z("union", [t.arrayExpression(schemas.map((s) => s.schema))]),
        type: this.#zSchemaType(
          t.tsUnionType(schemas.map((s) => this.#zResolvedType("input", s.type))),
          t.tsUnionType(schemas.map((s) => this.#zResolvedType("output", s.type))),
        ),
      };
    }

    if (schema.const) {
      const literal = this.#literal(schema.const);
      return {
        schema: this.#z("literal", [literal]),
        type: this.#zSchemaType(t.tsLiteralType(literal)),
      };
    }

    if (schema.enum) {
      const literals = schema.enum.map(this.#literal);
      return {
        schema: this.#z("enum", [t.arrayExpression(literals)]),
        type: this.#zSchemaType(t.tsUnionType(literals.map((l) => t.tsLiteralType(l)))),
      };
    }

    if ("type" in schema) {
      if (Array.isArray(schema.type)) {
        const schemas = schema.type.map((t) =>
          this.#getZodSchema(
            document,
            omit(
              {
                ...schema,
                type: t,
              },
              t === "null" ? ["x-sohcah-brand-id"] : [],
            ),
            {},
          ),
        );
        if (schemas.length === 1) {
          return schemas[0]!;
        }
        return {
          schema: this.#z("union", [t.arrayExpression(schemas.map((s) => s.schema))]),
          type: this.#zSchemaType(
            t.tsUnionType(schemas.map((s) => this.#zResolvedType("input", s.type))),
            t.tsUnionType(schemas.map((s) => this.#zResolvedType("output", s.type))),
          ),
        };
      }

      if (schema.type === "null") {
        return {
          schema: this.#z("null", []),
          type: this.#zSchemaType(t.tsNullKeyword()),
        };
      }

      if ("format" in schema && schema.format) {
        const formatOverride = this.#options.overrideFormats?.[schema.format];
        if (formatOverride) {
          if (formatOverride.type === "import") {
            ensureImport(this.#imports, formatOverride.name, formatOverride.from);
            return {
              schema: t.callExpression(t.identifier(formatOverride.name), []),
              type: t.tsTypeReference(
                t.identifier("ReturnType"),
                t.tsTypeParameterInstantiation([t.tsTypeQuery(t.identifier(formatOverride.name))]),
              ),
            };
          }
        }
      }

      const override = this.#options.overrideSchema?.(schema);
      if (override) {
        if (override.type === "import") {
          ensureImport(this.#imports, override.name, override.from);
          return {
            schema: t.callExpression(t.identifier(override.name), []),
            type: t.tsTypeReference(
              t.identifier("ReturnType"),
              t.tsTypeParameterInstantiation([t.tsTypeQuery(t.identifier(override.name))]),
            ),
          };
        }
      }

      if (schema.type === "string") {
        if (schema.contentMediaType || schema.format === "binary") {
          return {
            schema: this.#z("instanceof", [t.identifier("Blob")]),
            type: this.#zSchemaType(t.tsTypeReference(t.identifier("Blob"))),
          };
        }
        return {
          schema: this.#z("string", []),
          type: this.#zSchemaType(t.tsStringKeyword()),
        };
      }
      if (schema.type === "number") {
        return {
          schema: this.#z("number", []),
          type: this.#zSchemaType(t.tsNumberKeyword()),
        };
      }
      if (schema.type === "integer") {
        return {
          schema: this.#z("int", []),
          type: this.#zSchemaType(t.tsNumberKeyword()),
        };
      }
      if (schema.type === "boolean") {
        return {
          schema: this.#z("boolean", []),
          type: this.#zSchemaType(t.tsBooleanKeyword()),
        };
      }
      if (schema.type === "object") {
        return this.#getZodObjectSchema(document, schema, ctx);
      }
      if (schema.type === "array") {
        return this.#getZodArraySchema(document, schema, ctx);
      }
      schema.type satisfies never;
    }

    return {
      schema: this.#z("unknown", []),
      type: this.#zSchemaType(t.tsUnknownKeyword()),
    };
  }

  #simplifyZodSchema(zodSchema: ZodSchema): void {
    // If the schema is z.union([z.null(), ...]) or z.union([..., z.null()]), use ....nullable() instead.
    if (
      t.isCallExpression(zodSchema.schema) &&
      t.isMemberExpression(zodSchema.schema.callee) &&
      t.isIdentifier(zodSchema.schema.callee.object) &&
      zodSchema.schema.callee.object.name === "z" &&
      t.isIdentifier(zodSchema.schema.callee.property) &&
      zodSchema.schema.callee.property.name === "union" &&
      zodSchema.schema.arguments.length === 1 &&
      t.isArrayExpression(zodSchema.schema.arguments[0]!) &&
      zodSchema.schema.arguments[0]!.elements.length === 2
    ) {
      const elements = zodSchema.schema.arguments[0]!.elements;
      for (const index of [0, 1]) {
        if (
          t.isCallExpression(elements[index]) &&
          t.isMemberExpression(elements[index]!.callee) &&
          t.isIdentifier(elements[index]!.callee.object) &&
          elements[index]!.callee.object.name === "z" &&
          t.isIdentifier(elements[index]!.callee.property) &&
          elements[index]!.callee.property.name === "null" &&
          t.isExpression(elements[1 - index])
        ) {
          zodSchema.schema = this.#z("nullable", [elements[1 - index] as t.Expression], true);
        }
      }
    }
  }

  #discriminatedSchemas = new Set<string>();

  #getZodSchema(
    document: ApiDocument,
    schema: SchemaReferenceType,
    ctx: ZodSchemaContext,
  ): ZodSchema {
    const zodSchema = this.#getZodSchemaBase(document, schema, ctx);

    this.#simplifyZodSchema(zodSchema);

    if (
      "x-sohcah-brand-id" in schema &&
      typeof schema["x-sohcah-brand-id"] === "string" &&
      "type" in schema &&
      !Array.isArray(schema.type)
    ) {
      const key = `#/x-sohcah-brand-id/${schema["x-sohcah-brand-id"]}`;
      const identifier = t.identifier(schema["x-sohcah-brand-id"]);
      if (!this.#schemas.has(key)) {
        this.#schemas.set(key, {
          statements: [
            t.exportNamedDeclaration(
              t.variableDeclaration("const", [
                t.variableDeclarator(
                  identifier,
                  this.#z(
                    "brand",
                    [zodSchema.schema],
                    true,
                    t.tsTypeParameterInstantiation([
                      t.tsLiteralType(t.stringLiteral(schema["x-sohcah-brand-id"])),
                      t.tsLiteralType(t.stringLiteral("inout")),
                    ]),
                  ),
                ),
              ]),
            ),
            t.exportNamedDeclaration(
              t.tsTypeAliasDeclaration(
                identifier,
                null,
                this.#zResolvedType("output", t.tsTypeQuery(identifier)),
              ),
            ),
          ],
          meta: {},
        });
      }
      zodSchema.schema = identifier;
      zodSchema.type = t.tsTypeQuery(identifier);
    }

    return zodSchema;
  }

  async visitSchema(document: ApiDocument, ref: SchemaReferenceType): Promise<void> {
    this.#getZodSchema(document, ref, {});
  }

  #jsonBodyHandler(
    document: ApiDocument,
    content: MediaTypeObject,
  ): [t.Expression, ZodBodyOption] | null {
    if (!content.schema) {
      return null;
    }

    return [
      this.#createCodec(
        this.#z("object", [
          t.objectExpression([
            t.objectProperty(t.identifier("contentType"), this.#z("string", [])),
            t.objectProperty(t.identifier("content"), this.#z("string", [])),
          ]),
        ]),
        this.#getZodSchema(document, content.schema, {}).schema,
        this.#ensureNotImplementedFunction(),
        this.#ensureJsonContentEncodeFunction(),
      ),
      { hasContentType: true },
    ];
  }

  #multipartFormDataBodyHandler(
    document: ApiDocument,
    operationKey: string,
    content: MediaTypeObject,
  ): [t.Expression, ZodBodyOption] | null {
    if (!content.schema) {
      return null;
    }

    const encode = t.blockStatement([
      t.variableDeclaration("const", [
        t.variableDeclarator(
          t.identifier("formData"),
          t.newExpression(t.identifier("FormData"), []),
        ),
      ]),
    ]);

    const schema = dereferenceSchema(content.schema);
    if (!("type" in schema) || schema.type !== "object") {
      console.warn(`Unsupported multipart/form-data schema for operation ${operationKey}`);
      return null;
    }

    for (const [name, propertyRef] of Object.entries(schema.properties ?? {})) {
      const appendStatement = createAppendStatement(
        t.identifier("formData"),
        name,
        stringMemberExpression(t.identifier("value"), name),
        propertyRef,
        schema.required?.includes(name) ?? false,
      );
      if (appendStatement) {
        encode.body.push(appendStatement);
      } else {
        console.warn(
          `Unsupported multipart/form-data property ${name} for operation ${operationKey}`,
        );
      }
    }

    encode.body.push(
      t.returnStatement(
        t.objectExpression([t.objectProperty(t.identifier("content"), t.identifier("formData"))]),
      ),
    );

    return [
      this.#createCodec(
        this.#z("object", [
          t.objectExpression([
            t.objectProperty(
              t.identifier("content"),
              this.#z("instanceof", [t.identifier("FormData")]),
            ),
          ]),
        ]),
        this.#getZodSchema(document, content.schema, {}).schema,
        this.#ensureNotImplementedFunction(),
        t.arrowFunctionExpression([t.identifier("value")], encode),
      ),
      { hasContentType: false },
    ];
  }

  #bodyHandlers: Record<
    string,
    (
      document: ApiDocument,
      operationKey: string,
      content: MediaTypeObject,
    ) => [t.Expression, ZodBodyOption] | null
  > = {
    "application/json": (document, _, content) => this.#jsonBodyHandler(document, content),
    "multipart/form-data": (document, operationKey, content) =>
      this.#multipartFormDataBodyHandler(document, operationKey, content),
  };

  async #addOperationParameters(document: ApiDocument, ref: OperationReference): Promise<void> {
    let hasUsedValueIdentifier = false;
    const valueIdentifier = () => {
      hasUsedValueIdentifier = true;
      return t.identifier("value");
    };

    const operationKey = getOperationKey(ref);
    const safeOperationKey = getIdentifierSafeOperationKey(ref);

    const objectExpression = t.objectExpression([]);
    const pathParameters: Record<string, t.Expression> = {};
    const queryStatements = t.blockStatement([]);
    const headerStatements = t.blockStatement([]);
    for (const parameterRef of ref.operation.parameters ?? []) {
      const parameter = dereference(parameterRef);
      if (!("schema" in parameter) || !parameter.schema) {
        throw new Error(
          `Unsupported non-schema parameter ${parameter.name} for operation ${operationKey}`,
        );
      }
      const schema = this.#getZodSchema(document, parameter.schema, {}).schema;
      objectExpression.properties.push(
        t.objectProperty(
          stringLiteralOrIdentifier(parameter.name),
          parameter.required ? schema : this.#z("optional", [schema], true),
        ),
      );
      const parameterValue = stringMemberExpression(valueIdentifier(), parameter.name);
      if (parameter.in === "path") {
        pathParameters[parameter.name] = parameterValue;
      }
      if (parameter.in === "query") {
        const appendStatement = createAppendStatement(
          t.identifier("queryParams"),
          parameter.name,
          parameterValue,
          parameter.schema,
          parameter.required ?? false,
        );
        if (appendStatement) {
          queryStatements.body.push(appendStatement);
        } else {
          console.warn(
            `Unsupported query parameter ${parameter.name} for operation ${operationKey}`,
          );
        }
      }
      if (parameter.in === "header") {
        const appendStatement = createAppendStatement(
          t.identifier("headers"),
          parameter.name,
          parameterValue,
          parameter.schema,
          parameter.required ?? false,
        );
        if (appendStatement) {
          headerStatements.body.push(appendStatement);
        } else {
          console.warn(
            `Unsupported header parameter ${parameter.name} for operation ${operationKey}`,
          );
        }
      }
    }

    const bodyOptions: ZodBodyOption[] = [];

    if (ref.operation.requestBody) {
      const requestBody = dereference(ref.operation.requestBody);

      const contentOptions = new Map<string, t.Expression>();

      for (const [contentType, content] of Object.entries(requestBody.content ?? {})) {
        const key = JSON.stringify(content);
        if (contentOptions.has(key)) continue;

        const bodyHandler = this.#bodyHandlers[contentType];

        if (!bodyHandler) {
          console.warn(`Unsupported body type ${contentType} for operation ${operationKey}`);
          continue;
        }

        const result = bodyHandler(document, operationKey, content);
        if (!result) continue;

        contentOptions.set(key, result[0]);
        bodyOptions.push(result[1]);
      }

      if (!contentOptions.size) {
        console.warn(`No body handler found for operation ${operationKey}`);
      }

      objectExpression.properties.push(
        t.objectProperty(
          stringLiteralOrIdentifier("data"),
          contentOptions.size === 0
            ? this.#z("never", [])
            : contentOptions.size === 1
              ? contentOptions.values().next().value!
              : this.#z("union", [...contentOptions.values()]),
        ),
      );
    }

    if (bodyOptions.some((opt) => opt.hasContentType)) {
      headerStatements.body.push(
        createAppendStatement(
          t.identifier("headers"),
          "Content-Type",
          t.memberExpression(
            t.memberExpression(valueIdentifier(), t.identifier("data")),
            t.identifier("contentType"),
          ),
          { type: "string" },
          bodyOptions.every((opt) => opt.hasContentType),
        )!,
      );
    }

    const parameterEncode = t.blockStatement([]);
    if (queryStatements.body.length > 0) {
      parameterEncode.body.push(
        t.variableDeclaration("const", [
          t.variableDeclarator(
            t.identifier("queryParams"),
            t.newExpression(t.identifier("URLSearchParams"), []),
          ),
        ]),
        ...queryStatements.body,
      );
    }
    if (headerStatements.body.length > 0) {
      parameterEncode.body.push(
        t.variableDeclaration("const", [
          t.variableDeclarator(
            t.identifier("headers"),
            t.newExpression(t.identifier("Headers"), []),
          ),
        ]),
        ...headerStatements.body,
      );
    }

    const returnObject = t.objectExpression([
      t.objectProperty(
        t.identifier("path"),
        generatePathExpression(
          ref.pathKey,
          pathParameters,
          queryStatements.body.length ? t.identifier("queryParams") : null,
        ),
      ),
      t.objectProperty(t.identifier("method"), t.stringLiteral(ref.methodKey.toUpperCase())),
    ]);

    if (headerStatements.body.length > 0) {
      returnObject.properties.push(
        t.objectProperty(t.identifier("headers"), t.identifier("headers")),
      );
    }

    if (bodyOptions.length) {
      returnObject.properties.push(
        t.objectProperty(
          t.identifier("body"),
          t.memberExpression(
            t.memberExpression(valueIdentifier(), t.identifier("data")),
            t.identifier("content"),
          ),
        ),
      );
    }

    parameterEncode.body.push(t.returnStatement(returnObject));
    this.#operations.push(
      comment(
        ref.operation.description,
        t.exportNamedDeclaration(
          t.variableDeclaration("const", [
            t.variableDeclarator(
              t.identifier(`${safeOperationKey}_Parameters`),
              this.#createCodec(
                this.#ensureParametersSchema(),
                this.#z("object", [objectExpression]),
                this.#ensureNotImplementedFunction(),
                t.arrowFunctionExpression(
                  hasUsedValueIdentifier ? [valueIdentifier()] : [],
                  parameterEncode,
                ),
              ),
            ),
          ]),
        ),
      ),
    );
  }

  async #addOperationResponse(document: ApiDocument, ref: OperationReference): Promise<void> {
    const operationKey = getOperationKey(ref);
    const safeOperationKey = getIdentifierSafeOperationKey(ref);

    const responseOptions = t.arrayExpression([]);

    for (const [status, responseRef] of Object.entries(ref.operation.responses ?? {})) {
      if (!status.match(/^\d{3}$/)) {
        console.warn(`Unsupported status code ${status} for operation ${operationKey}`);
        continue;
      }

      const response = dereference(responseRef);

      const noContentResponse = () =>
        this.#z("object", [
          t.objectExpression([
            t.objectProperty(
              t.identifier("code"),
              this.#z("literal", [t.numericLiteral(Number(status))]),
            ),
            t.objectProperty(
              t.identifier("contentType"),
              this.#z("optional", [this.#z("string", [])], true),
            ),
            t.objectProperty(t.identifier("response"), this.#ensureBlobResponseCodec()),
          ]),
        ]);

      if (!response.content) {
        responseOptions.elements.push(comment(response.description, noContentResponse()));
      } else {
        const statusResponses = t.arrayExpression([]);

        for (const entry of Map.groupBy(Object.entries(response.content ?? {}), (i) =>
          JSON.stringify(i[1]),
        ).values()) {
          const contentTypes = entry.map((i) => i[0]);
          const content = dereference(entry[0]![1]);
          if (!content.schema) {
            console.warn(
              `Unsupported content types ${contentTypes.join(", ")} for operation ${operationKey}`,
            );
            continue;
          }
          const schema = this.#getZodSchema(document, content.schema, {}).schema;
          statusResponses.elements.push(
            this.#z("object", [
              t.objectExpression([
                t.objectProperty(
                  t.identifier("code"),
                  this.#z("literal", [t.numericLiteral(Number(status))]),
                ),
                t.objectProperty(
                  t.identifier("contentType"),
                  this.#z("literal", [
                    t.arrayExpression(contentTypes.map((i) => t.stringLiteral(i))),
                  ]),
                ),
                t.objectProperty(
                  t.identifier("response"),
                  this.#z("pipe", [this.#ensureJsonResponseCodec(), schema]),
                ),
              ]),
            ]),
          );
        }

        if (statusResponses.elements.length === 0) {
          responseOptions.elements.push(comment(response.description, noContentResponse()));
        } else {
          responseOptions.elements.push(
            comment(
              response.description,
              this.#z("discriminatedUnion", [t.stringLiteral("contentType"), statusResponses]),
            ),
          );
        }
      }
    }

    this.#operations.push(
      t.exportNamedDeclaration(
        t.variableDeclaration("const", [
          t.variableDeclarator(
            t.identifier(`${safeOperationKey}_Response`),
            this.#z("discriminatedUnion", [t.stringLiteral("code"), responseOptions]),
          ),
        ]),
      ),
    );
  }

  async visitOperation(document: ApiDocument, ref: OperationReference): Promise<void> {
    this.#addOperationParameters(document, ref);

    this.#addOperationResponse(document, ref);
  }

  async complete(): Promise<void> {
    const program = t.program([
      ...this.#imports,
      ...this.#header,
      ...[...this.#schemas.values()].flatMap((i) => i.statements),
      ...this.#operations,
    ]);
    await writeFile(this.#options.output, generate(program).code);
  }

  async [JsSchemaGeneratorExtension.getParameterType](doc: JsDocument, ref: OperationReference) {
    ensureImport(doc.imports, "z", "zod", true);
    const schemaName = `${getIdentifierSafeOperationKey(ref)}_Parameters`;
    ensureImport(
      doc.imports,
      schemaName,
      relativeImportPath(doc.path, this.#options.output, doc.importExtensions),
      true,
    );
    return this.#zResolvedType("output", t.tsTypeQuery(t.identifier(schemaName)));
  }
  async [JsSchemaGeneratorExtension.encodeParameters](
    doc: JsDocument,
    ref: OperationReference,
    parameters: t.Expression,
  ) {
    ensureImport(doc.imports, "z", "zod");
    const schemaName = `${getIdentifierSafeOperationKey(ref)}_Parameters`;
    ensureImport(
      doc.imports,
      schemaName,
      relativeImportPath(doc.path, this.#options.output, doc.importExtensions),
    );
    return this.#z("encodeAsync", [t.identifier(schemaName), parameters]);
  }
  async [JsSchemaGeneratorExtension.getResponseType](doc: JsDocument, ref: OperationReference) {
    ensureImport(doc.imports, "z", "zod", true);
    const schemaName = `${getIdentifierSafeOperationKey(ref)}_Response`;
    ensureImport(
      doc.imports,
      schemaName,
      relativeImportPath(doc.path, this.#options.output, doc.importExtensions),
      true,
    );
    return this.#zResolvedType("output", t.tsTypeQuery(t.identifier(schemaName)));
  }
  async [JsSchemaGeneratorExtension.parseResponse](
    doc: JsDocument,
    ref: OperationReference,
    response: t.Expression,
  ) {
    ensureImport(doc.imports, "z", "zod");
    const schemaName = `${getIdentifierSafeOperationKey(ref)}_Response`;
    ensureImport(
      doc.imports,
      schemaName,
      relativeImportPath(doc.path, this.#options.output, doc.importExtensions),
    );
    return this.#z("parseAsync", [
      t.identifier(schemaName),
      t.objectExpression([
        t.objectProperty(
          t.identifier("code"),
          t.memberExpression(response, t.identifier("status")),
        ),
        t.objectProperty(
          t.identifier("contentType"),
          t.optionalMemberExpression(
            t.optionalCallExpression(
              t.optionalMemberExpression(
                t.callExpression(
                  t.memberExpression(
                    t.memberExpression(response, t.identifier("headers")),
                    t.identifier("get"),
                  ),
                  [t.stringLiteral("Content-Type")],
                ),
                t.identifier("split"),
                false,
                true,
              ),
              [t.stringLiteral(";")],
              false,
            ),
            t.numericLiteral(0),
            true,
            true,
          ),
        ),
        t.objectProperty(t.identifier("response"), response),
      ]),
    ]);
  }
}

export function createZodGenerator(options: ZodGeneratorOptions) {
  return () => new ZodGenerator(options);
}
