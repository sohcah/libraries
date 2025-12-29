import * as t from "@babel/types";
import type {
  MediaTypeObject,
  OperationObject,
  ReferenceObject,
  ResponseObject,
  SchemaObject,
} from "../types.js";
import { Context, Effect } from "effect";
import { DocumentContext, type DocumentContextData } from "../context.js";
import * as generationHelpers from "./helpers.js";
import type { YieldWrap } from "effect/Utils";
import type { ImportReference, OpenApiSchemaGenerator } from "./types.js";
import { NotImplementedError } from "../errors.js";
import { generateJsonRequestCodec } from "./requestFormats/json.js";
import { generateFormDataRequestCodec } from "./requestFormats/formData.js";
import { generatePathExpression } from "./generatePathExpression.js";
import { generateJsonResponseCodec } from "./responseFormats/json.js";
import { generateBlobResponseCodec } from "./responseFormats/blob.js";

export interface SchemaGeneratorOptions {
  /** @default null */
  custom?: (schema: SchemaObject) => ImportReference | null;

  /** @default false */
  experimental_includeTypes?: boolean;

  /** @default true */
  includeSchemas?: boolean;

  /** @default false */
  includeOperations?: boolean;

  /** @default "unknown" */
  deprecationHandling?: "unknown" | "optional";
}

export interface DefaultSchemaGeneratorOptions extends SchemaGeneratorOptions {
  modifiers: {
    lazy: (expression: t.Expression) => t.Expression;
    optional: (expression: t.Expression) => t.Expression;
    regex: (expression: t.Expression, pattern: string) => t.Expression;
    immutable: (expression: t.Expression) => t.Expression;
    mutable: (expression: t.Expression) => t.Expression;
    nullable: (expression: t.Expression) => t.Expression;
  };
  types: {
    schema: t.TSQualifiedName;
    typeDecoded: t.TSQualifiedName;
    typeEncoded: t.TSQualifiedName;
  };
  schema: {
    record: (key: t.Expression, value: t.Expression) => t.Expression;
    union: (expressions: t.Expression[]) => t.Expression;
    intersection: (expressions: t.Expression[]) => t.Expression;
    objectExtend: (expressions: t.Expression[]) => t.Expression;
    enum: (expressions: t.Expression[]) => t.Expression;
    instanceOf: t.Expression;
    boolean: t.Expression;
    string: t.Expression;
    number: t.Expression;
    integer: t.Expression;
    array: t.Expression;
    object: t.Expression;
    null: t.Expression;
    unknown: t.Expression;
  };
  transformer: (options: {
    encoded: t.Expression;
    decoded: t.Expression;
    decode: t.Expression | t.BlockStatement;
    decodeAsync?: boolean;
    encode: t.Expression | t.BlockStatement;
    encodeAsync?: boolean;
  }) => t.Expression;
  transformerCatch: (expression: t.Expression) => t.BlockStatement;
  methods: {
    encode: (schema: t.Expression, value: t.Expression) => t.Expression;
    decode: (schema: t.Expression, value: t.Expression) => t.Expression;
    parse: (schema: t.Expression, value: t.Expression) => t.Expression;
  };
  supportsImmutability: boolean;
}

export type ExpressionWithType = {
  expression: t.Expression;
  typeDecoded: t.TSType;
  typeEncoded: t.TSType;
  typeMeta: {
    readonly?: boolean;
    optional?: boolean;
    isObject?: boolean;
  };
};

const equivalentType = (type: t.TSType) => ({
  typeDecoded: type,
  typeEncoded: type,
});

export const resolveSchema = Effect.fn(function* (
  schema: SchemaObject | ReferenceObject
): Generator<
  | YieldWrap<Effect.Effect<SchemaObject, NotImplementedError, DocumentContext>>
  | YieldWrap<Context.Tag<DocumentContext, DocumentContextData>>,
  SchemaObject,
  never
> {
  const ctx = yield* DocumentContext;
  let resolvedSchema = schema;
  for (let i = 0; i < 10; i++) {
    if (!("$ref" in resolvedSchema))
      return resolvedSchema satisfies SchemaObject as SchemaObject;
    const ref = resolvedSchema.$ref;
    if (!ref.startsWith("#/components/schemas/"))
      return yield* new NotImplementedError({
        message: `$ref ${ref}`,
      });
    const schemaName = ref.slice("#/components/schemas/".length);

    const nextSchema = ctx.document.components?.schemas?.[schemaName];
    if (!nextSchema) {
      return yield* new NotImplementedError({
        message: `Missing $ref ${ref}`,
      });
    }
    resolvedSchema = nextSchema;
  }
  return yield* new NotImplementedError({
    message: `Too many $ref in schema`,
  });
});

const stringLiteralOrIdentifier = (value: string) => {
  if (value.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
    return t.identifier(value);
  }
  return t.stringLiteral(value);
};

const memberExpressionWithStringProperty = (
  object: t.Expression,
  property: string
) => {
  if (property.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
    return t.memberExpression(object, t.identifier(property));
  }
  return t.memberExpression(object, t.stringLiteral(property), true);
};

export function createSchemaGenerator(
  options: DefaultSchemaGeneratorOptions
): OpenApiSchemaGenerator {
  const ensureStandardParametersSchema = Effect.fn(function* () {
    const ctx = yield* DocumentContext;
    if (!ctx.schemas.has("ParametersSchema")) {
      ctx.schemas.set("ParametersSchema", [
        t.exportNamedDeclaration(
          t.variableDeclaration("const", [
            t.variableDeclarator(
              t.identifier("ParametersSchema"),
              t.callExpression(options.schema.object, [
                t.objectExpression([
                  t.objectProperty(t.identifier("path"), options.schema.string),
                  t.objectProperty(
                    t.identifier("headers"),
                    options.modifiers.optional(
                      t.callExpression(options.schema.instanceOf, [
                        t.identifier("Headers"),
                      ])
                    )
                  ),
                  t.objectProperty(
                    t.identifier("body"),
                    options.modifiers.optional(
                      options.schema.union([
                        options.schema.string,
                        t.callExpression(options.schema.instanceOf, [
                          t.identifier("Blob"),
                        ]),
                        t.callExpression(options.schema.instanceOf, [
                          t.identifier("FormData"),
                        ]),
                        t.callExpression(options.schema.instanceOf, [
                          t.identifier("URLSearchParams"),
                        ]),
                      ])
                    )
                  ),
                ]),
              ])
            ),
          ])
        ),
      ]);
    }

    return t.identifier("ParametersSchema");
  });

  const getBaseEffectSchema = Effect.fn(function* (
    schema: SchemaObject | ReferenceObject
  ) {
    const ctx = yield* DocumentContext;

    const typeMeta: ExpressionWithType["typeMeta"] = {};

    if ("$ref" in schema) {
      const ref = schema.$ref;
      if (!ref.startsWith("#/components/schemas/"))
        return yield* new NotImplementedError({
          message: `$ref ${ref}`,
        });
      const schemaName = ref.slice("#/components/schemas/".length);
      const schemaKey = yield* generationHelpers.getKey(schemaName);

      const resolvedSchema = ctx.document.components?.schemas?.[schemaName];
      if (!resolvedSchema) {
        return yield* new NotImplementedError({
          message: `Missing $ref ${ref}`,
        });
      }

      if (ctx.processingSchemas.has(schemaName)) {
        const fn = t.arrowFunctionExpression([], t.identifier(schemaKey.upper));
        if (ctx.processingSchemaTypes.has(schemaName)) {
          return {
            expression: t.nullLiteral(),
            typeDecoded: t.tsTypeReference(
              options.types.typeDecoded,
              t.tsTypeParameterInstantiation([
                t.tsTypeQuery(t.identifier(schemaKey.upper)),
              ])
            ),
            typeEncoded: t.tsTypeReference(
              options.types.typeEncoded,
              t.tsTypeParameterInstantiation([
                t.tsTypeQuery(t.identifier(schemaKey.upper)),
              ])
            ),
            typeMeta,
          };
        }
        ctx.processingSchemaTypes.add(schemaName);
        const typeSchema = yield* ensureSchema(resolvedSchema);
        fn.returnType = t.tsTypeAnnotation(
          t.tsTypeReference(
            options.types.schema,
            t.tsTypeParameterInstantiation([
              typeSchema.typeDecoded,
              typeSchema.typeEncoded,
            ])
          )
        );
        ctx.processingSchemaTypes.delete(schemaName);
        return {
          expression: options.modifiers.lazy(fn),
          typeDecoded: t.tsTypeReference(
            options.types.typeDecoded,
            t.tsTypeParameterInstantiation([
              t.tsTypeQuery(t.identifier(schemaKey.upper)),
            ])
          ),
          typeEncoded: t.tsTypeReference(
            options.types.typeEncoded,
            t.tsTypeParameterInstantiation([
              t.tsTypeQuery(t.identifier(schemaKey.upper)),
            ])
          ),
          typeMeta,
        };
      }

      if (!ctx.schemas.has(schemaName)) {
        ctx.processingSchemas.add(schemaName);

        const schemaExpression = yield* ensureSchema(resolvedSchema);

        const schemaKeyIdentifier = t.identifier(schemaKey.upper);
        if (options.experimental_includeTypes) {
          schemaKeyIdentifier.typeAnnotation = t.tsTypeAnnotation(
            t.tsTypeReference(
              options.types.schema,
              t.tsTypeParameterInstantiation([
                schemaExpression.typeDecoded,
                schemaExpression.typeEncoded,
              ])
            )
          );
        }

        ctx.schemas.set(schemaName, [
          t.exportNamedDeclaration(
            t.variableDeclaration("const", [
              t.variableDeclarator(
                schemaKeyIdentifier,
                schemaExpression.expression
              ),
            ])
          ),

          t.exportNamedDeclaration(
            t.tsTypeAliasDeclaration(
              t.identifier(schemaKey.upper),
              null,
              t.tsTypeReference(
                options.types.typeDecoded,
                t.tsTypeParameterInstantiation([
                  t.tsTypeQuery(t.identifier(schemaKey.upper)),
                ])
              )
            )
          ),
        ]);
        ctx.schemaTypeMeta.set(schemaName, schemaExpression.typeMeta);
        ctx.processingSchemas.delete(schemaName);
      }

      return {
        expression: t.identifier(schemaKey.upper),
        typeDecoded: t.tsTypeReference(
          options.types.typeDecoded,
          t.tsTypeParameterInstantiation([
            t.tsTypeQuery(t.identifier(schemaKey.upper)),
          ])
        ),
        typeEncoded: t.tsTypeReference(
          options.types.typeEncoded,
          t.tsTypeParameterInstantiation([
            t.tsTypeQuery(t.identifier(schemaKey.upper)),
          ])
        ),
        typeMeta: ctx.schemaTypeMeta.get(schemaName)!,
      };
    }

    if (schema.deprecated) {
      if (options.deprecationHandling === "optional") {
        typeMeta.optional = true;
      } else {
        return {
          expression: options.modifiers.optional(options.schema.unknown),
          ...equivalentType(
            t.tsUnionType([t.tsUnknownKeyword(), t.tsUndefinedKeyword()])
          ),
          typeMeta,
        };
      }
    }

    const customResult = options.custom?.(schema);

    if (customResult) {
      const identifier = yield* generationHelpers.ensureImport(
        customResult.name,
        customResult.from
      );
      const returnType = t.tsTypeReference(
        t.identifier("ReturnType"),
        t.tsTypeParameterInstantiation([t.tsTypeQuery(identifier)])
      );
      return {
        expression: t.callExpression(identifier, []),
        typeDecoded: t.tsTypeReference(
          options.types.typeDecoded,
          t.tsTypeParameterInstantiation([returnType])
        ),
        typeEncoded: t.tsTypeReference(
          options.types.typeEncoded,
          t.tsTypeParameterInstantiation([returnType])
        ),
        typeMeta,
      };
    }

    if (schema.allOf) {
      const results = yield* Effect.forEach(
        (schema: SchemaObject | ReferenceObject) => ensureSchema(schema)
      )(schema.allOf);

      let result: ExpressionWithType;
      if (results.length === 1) {
        result = results[0]!;
      } else {
        result = {
          expression: options.schema[
            results.every((i) => i.typeMeta.isObject)
              ? "objectExtend"
              : "intersection"
          ](results.map((result) => result.expression)),
          typeDecoded: t.tsIntersectionType(
            results.map((result) => result.typeDecoded)
          ),
          typeEncoded: t.tsIntersectionType(
            results.map((result) => result.typeEncoded)
          ),
          typeMeta,
        };
      }

      // Workaround to support Swashbuckle.AspNetCore's nullable attribute on allOf objects.
      if ("nullable" in schema && schema.nullable) {
        result.expression = options.modifiers.nullable(result.expression);
        result.typeDecoded = t.tsUnionType([
          result.typeDecoded,
          t.tsNullKeyword(),
        ]);
        result.typeEncoded = t.tsUnionType([
          result.typeEncoded,
          t.tsNullKeyword(),
        ]);
      }
      return result;
    }

    if (schema.enum) {
      const unsupportedEnumValue = schema.enum.find(
        (i: unknown) =>
          typeof i !== "string" &&
          typeof i !== "number" &&
          typeof i !== "boolean" &&
          i !== null
      );
      if (unsupportedEnumValue !== undefined) {
        return yield* new NotImplementedError({
          message: `Unsupported 'enum' value: ${JSON.stringify(unsupportedEnumValue)}`,
        });
      }
      const getLiteral = (value: unknown) => {
        if (typeof value === "number") {
          return t.numericLiteral(value);
        }
        if (typeof value === "boolean") {
          return t.booleanLiteral(value);
        }
        return t.stringLiteral(value as string);
      };
      return {
        expression: options.schema.enum(
          schema.enum.map((e: unknown) =>
            e === null ? t.nullLiteral() : getLiteral(e)
          )
        ),
        ...equivalentType(
          t.tsUnionType(
            schema.enum.map((e: unknown) =>
              e === null ? t.tsNullKeyword() : t.tsLiteralType(getLiteral(e))
            )
          )
        ),
        typeMeta,
      };
    }

    switch (schema.type) {
      case "boolean": {
        return {
          expression: options.schema.boolean,
          ...equivalentType(t.tsBooleanKeyword()),
          typeMeta,
        };
      }
      case "string": {
        if (schema.format === "binary") {
          return {
            expression: t.callExpression(options.schema.instanceOf, [
              t.identifier("Blob"),
            ]),
            ...equivalentType(t.tsTypeReference(t.identifier("Blob"))),
            typeMeta,
          };
        }

        let expression: ExpressionWithType = {
          expression: options.schema.string,
          ...equivalentType(t.tsStringKeyword()),
          typeMeta,
        };
        if (schema.pattern) {
          expression.expression = options.modifiers.regex(
            expression.expression,
            schema.pattern
          );
        }
        return expression;
      }
      case "number": {
        return {
          expression: options.schema.number,
          ...equivalentType(t.tsNumberKeyword()),
          typeMeta,
        };
      }
      case "integer": {
        return {
          expression: options.schema.integer,
          ...equivalentType(t.tsNumberKeyword()),
          typeMeta,
        };
      }
      case "object": {
        typeMeta.isObject = true;
        const object = t.objectExpression([]);
        const objectTypeDecoded = t.tsTypeLiteral([]);
        const objectTypeEncoded = t.tsTypeLiteral([]);
        for (const [propertyKey, property] of Object.entries(
          schema.properties ?? {}
        ) as [string, SchemaObject | ReferenceObject][]) {
          let propertySchema = yield* ensureSchema(property);
          const decodedMember = t.tsPropertySignature(
            t.identifier(propertyKey),
            t.tsTypeAnnotation(propertySchema.typeDecoded)
          );
          const encodedMember = t.tsPropertySignature(
            t.identifier(propertyKey),
            t.tsTypeAnnotation(propertySchema.typeEncoded)
          );
          decodedMember.readonly = !!propertySchema.typeMeta?.readonly;
          encodedMember.readonly = !!propertySchema.typeMeta?.readonly;
          if (
            propertySchema.typeMeta?.optional ||
            !schema.required?.includes(propertyKey)
          ) {
            propertySchema.expression = options.modifiers.optional(
              propertySchema.expression
            );
            decodedMember.optional = true;
            encodedMember.optional = true;
          }
          const objectProperty = t.objectProperty(
            stringLiteralOrIdentifier(propertyKey),
            propertySchema.expression
          );
          if (property.description) {
            t.addComment(
              objectProperty,
              "leading",
              `* ${property.description}`
            );
          }
          object.properties.push(objectProperty);
          objectTypeDecoded.members.push(decodedMember);
          objectTypeEncoded.members.push(encodedMember);
        }
        return {
          expression: t.callExpression(options.schema.object, [object]),
          typeDecoded: objectTypeDecoded,
          typeEncoded: objectTypeEncoded,
          typeMeta,
        };
      }
      case "array": {
        const itemsSchema = yield* ensureSchema(schema.items);
        let expression: t.Expression = t.callExpression(options.schema.array, [
          itemsSchema.expression,
        ]);
        let typeDecoded: t.TSType = t.tsArrayType(itemsSchema.typeDecoded);
        let typeEncoded: t.TSType = t.tsArrayType(itemsSchema.typeEncoded);
        if (options.supportsImmutability) {
          if (itemsSchema.typeMeta?.readonly) {
            expression = options.modifiers.immutable(expression);
            typeDecoded = t.tsTypeOperator(typeDecoded, "readonly");
            typeEncoded = t.tsTypeOperator(typeEncoded, "readonly");
          } else {
            expression = options.modifiers.mutable(expression);
          }
        }
        return {
          expression,
          typeDecoded,
          typeEncoded,
          typeMeta,
        };
      }
      case "null": {
        return {
          expression: options.schema.null,
          ...equivalentType(t.tsNullKeyword()),
          typeMeta,
        };
      }
      case undefined: {
        return {
          expression: options.schema.unknown,
          ...equivalentType(t.tsUnknownKeyword()),
          typeMeta,
        };
      }
      default: {
        console.info(schema);
        return yield* new NotImplementedError({
          message: `type ${schema.type}`,
        });
      }
    }
  });

  const applyModifiers = Effect.fn(function* (
    expression: ExpressionWithType,
    schema: SchemaObject | ReferenceObject
  ) {
    if ("$ref" in schema) return expression;

    const modified = { ...expression };

    if (options.supportsImmutability) {
      if (schema.readOnly) {
        modified.expression = options.modifiers.immutable(modified.expression);
        modified.typeMeta ??= {};
        modified.typeMeta.readonly = true;
      } else {
        modified.expression = options.modifiers.mutable(modified.expression);
      }
    }

    return modified;
  });

  const ensureSchema = Effect.fn(function* (
    schema: SchemaObject | ReferenceObject
  ): Generator<
    YieldWrap<
      Effect.Effect<ExpressionWithType, NotImplementedError, DocumentContext>
    >,
    ExpressionWithType,
    never
  > {
    let schemas = [schema]
      .flatMap<SchemaObject | ReferenceObject>((schema) => {
        if ("$ref" in schema) return [schema];
        if (schema.oneOf) {
          return schema.oneOf;
        }
        return [schema];
      })
      .flatMap<SchemaObject | ReferenceObject>((schema) => {
        if (typeof schema === "boolean") return [];
        if ("$ref" in schema) return [schema];
        if (Array.isArray(schema.type)) {
          return schema.type.map(
            (type) =>
              ({
                ...schema,
                type,
              }) as SchemaObject
          );
        }
        return [schema];
      });

    const expressions: ExpressionWithType[] = [];
    for (const schema of schemas) {
      expressions.push(
        yield* applyModifiers(yield* getBaseEffectSchema(schema), schema)
      );
    }

    if (expressions.length !== 1) {
      return {
        expression: options.schema.union(expressions.map((e) => e.expression)),
        typeDecoded: t.tsUnionType(expressions.map((e) => e.typeDecoded)),
        typeEncoded: t.tsUnionType(expressions.map((e) => e.typeEncoded)),
        typeMeta: {},
      };
    }

    return expressions[0]!;
  });

  const ensureParametersSchema = Effect.fn(function* (
    operationKey: generationHelpers.OperationKey,
    method: OperationObject,
    path: string
  ) {
    const ctx = yield* DocumentContext;
    const identifier = t.identifier(`${operationKey.upper}_Parameters`);
    const object = t.objectExpression([]);

    const queryArray = t.arrayExpression([]);
    const pathParameters: Record<string, t.Expression> = {};
    const headerArray = t.arrayExpression([]);
    let hasBody = false;

    for (let parameter of method.parameters ?? []) {
      if ("$ref" in parameter) {
        const newParameter =
          ctx.document.components?.parameters?.[
            parameter.$ref.slice("#/components/parameters/".length)
          ];
        if (newParameter) {
          parameter = newParameter;
        } else {
          return yield* new NotImplementedError({
            message: "Unresolved $ref in parameter",
          });
        }
        if ("$ref" in parameter) {
          return yield* new NotImplementedError({
            message: "$ref in parameter",
          });
        }
      }
      if (!parameter.schema) {
        return yield* new NotImplementedError({
          message: "parameter without schema",
        });
      }
      let expression = (yield* ensureSchema(parameter.schema)).expression;
      if (!parameter.required) {
        expression = options.modifiers.optional(expression);
      }
      const objectProperty = t.objectProperty(
        stringLiteralOrIdentifier(parameter.name),
        expression
      );
      if (parameter.description) {
        t.addComment(objectProperty, "leading", `* ${parameter.description}`);
      }
      object.properties.push(objectProperty);
      if (parameter.in === "query") {
        const param = memberExpressionWithStringProperty(
          t.identifier("from"),
          parameter.name
        );
        // TODO: Share formData request format logic
        if ("type" in parameter.schema && parameter.schema.type === "array") {
          queryArray.elements.push(
            t.spreadElement(
              t.logicalExpression(
                "??",
                Object.assign(
                  t.optionalCallExpression(
                    t.optionalMemberExpression(
                      param,
                      t.identifier("map"),
                      false,
                      true
                    ),
                    [
                      t.arrowFunctionExpression(
                        [t.identifier("value")],
                        t.arrayExpression([
                          t.stringLiteral(parameter.name),
                          t.callExpression(t.identifier("String"), [
                            t.identifier("value"),
                          ]),
                        ])
                      ),
                    ],
                    false
                  ),
                  {
                    typeParameters: t.tsTypeParameterInstantiation([
                      t.tsTupleType([t.tsStringKeyword(), t.tsStringKeyword()]),
                    ]),
                  }
                ),
                t.arrayExpression([])
              )
            )
          );
        } else {
          queryArray.elements.push(
            t.arrayExpression([
              t.stringLiteral(parameter.name),
              t.callExpression(t.identifier("String"), [param]),
            ])
          );
        }
      } else if (parameter.in === "path") {
        pathParameters[parameter.name] = memberExpressionWithStringProperty(
          t.identifier("from"),
          parameter.name
        );
      } else if (parameter.in === "header") {
        headerArray.elements.push(
          t.arrayExpression([
            t.stringLiteral(parameter.name),
            t.callExpression(t.identifier("String"), [
              memberExpressionWithStringProperty(
                t.identifier("from"),
                parameter.name
              ),
            ]),
          ])
        );
      } else {
        return yield* new NotImplementedError({
          message: `parameter in ${parameter.in}`,
        });
      }
    }

    const body = yield* requestBodySchema(operationKey, method);
    if (body) {
      hasBody = true;
      object.properties.push(t.objectProperty(t.identifier("data"), body.data));
      headerArray.elements.push(...body.headers);
    }

    const decodedSchema = t.callExpression(options.schema.object, [object]);

    const transform = options.transformer({
      encoded: yield* ensureStandardParametersSchema(),
      decoded: decodedSchema,
      decode: t.blockStatement([
        t.throwStatement(
          t.newExpression(t.identifier("Error"), [
            t.stringLiteral("Not implemented"),
          ])
        ),
      ]),
      encode: t.objectExpression([
        t.objectProperty(
          t.identifier("path"),
          generatePathExpression(
            path,
            pathParameters,
            queryArray.elements.length
              ? t.newExpression(t.identifier("URLSearchParams"), [queryArray])
              : null
          )
        ),
        ...(headerArray.elements.length
          ? [
              t.objectProperty(
                t.identifier("headers"),
                t.newExpression(t.identifier("Headers"), [headerArray])
              ),
            ]
          : []),
        ...(hasBody
          ? [
              t.objectProperty(
                t.identifier("body"),
                t.memberExpression(t.identifier("from"), t.identifier("data"))
              ),
            ]
          : []),
      ]),
    });

    ctx.schemas.set(identifier.name, [
      t.exportNamedDeclaration(
        t.variableDeclaration("const", [
          t.variableDeclarator(identifier, transform),
        ])
      ),
    ]);

    return {
      expression: identifier,
      typeReference: t.tsTypeReference(
        options.types.typeDecoded,
        t.tsTypeParameterInstantiation([t.tsTypeQuery(identifier)])
      ),
    };
  });

  const requestBodySchema = Effect.fn(function* (
    operationKey: generationHelpers.OperationKey,
    method: OperationObject
  ) {
    if (!method.requestBody) {
      return null;
    }

    if ("$ref" in method.requestBody) {
      return yield* new NotImplementedError({
        message: "$ref in requestBody",
      });
    }

    let hasBody = false;

    for (const contentType in method.requestBody.content) {
      hasBody = true;
      const schema = method.requestBody.content[contentType]?.schema;
      if (contentType === "application/json") {
        if (!schema) continue;
        return {
          headers: [
            t.arrayExpression([
              t.stringLiteral("Content-Type"),
              t.stringLiteral("application/json"),
            ]),
          ],
          data: yield* generateJsonRequestCodec(
            options,
            yield* resolveSchema(schema),
            (yield* ensureSchema(schema)).expression
          ),
        };
      } else if (contentType === "multipart/form-data") {
        if (!schema) continue;
        return {
          headers: [],
          data: yield* generateFormDataRequestCodec(
            options,
            yield* resolveSchema(schema),
            (yield* ensureSchema(schema)).expression
          ),
        };
      } else {
        if (
          schema &&
          ("$ref" in schema ||
            (schema.type !== "string" && schema.format !== "binary"))
        ) {
          continue;
        }
        return {
          headers: [
            t.arrayExpression([
              t.stringLiteral("Content-Type"),
              t.stringLiteral(contentType),
            ]),
          ],
          data: t.callExpression(options.schema.instanceOf, [
            t.identifier("Blob"),
          ]),
        };
      }
    }

    if (!hasBody) {
      return null;
    }

    return yield* new NotImplementedError({
      message: `No supported requestBody type (${Object.keys(
        method.requestBody.content
      ).join(", ")}) in ${operationKey.upper}`,
    });
  });

  const responseSchema = Effect.fn(function* (
    content: { [format: string]: MediaTypeObject | ReferenceObject } | undefined
  ) {
    if (content) {
      for (const [format, formatContent] of Object.entries(content)) {
        if (format === "application/json") {
          if (!formatContent.schema) {
            continue;
          }

          const schema = formatContent.schema;

          const decodedSchema = (yield* ensureSchema(schema)).expression;

          return yield* generateJsonResponseCodec(
            options,
            yield* resolveSchema(schema),
            decodedSchema
          );
        }
      }
    }

    return yield* generateBlobResponseCodec(options);
  });

  const ensureResponseSchema = Effect.fn(function* (
    operationKey: generationHelpers.OperationKey,
    method: OperationObject
  ) {
    const ctx = yield* DocumentContext;

    let transform: t.Expression;

    if (!method.responses?.["200"]) {
      transform = yield* responseSchema(undefined);
    } else {
      let response: ResponseObject;

      if ("$ref" in method.responses["200"]) {
        const ref = method.responses["200"].$ref;
        if (!ref.startsWith("#/components/responses/"))
          return yield* new NotImplementedError({
            message: `$ref ${ref} in response in ${operationKey.upper}`,
          });
        const responseName = ref.slice("#/components/responses/".length);
        const newResponse = ctx.document.components?.responses?.[responseName];
        if (!newResponse)
          return yield* new NotImplementedError({
            message: `Missing $ref ${ref} in response in ${operationKey.upper}`,
          });

        if ("$ref" in newResponse)
          return yield* new NotImplementedError({
            message: `$ref in $ref in response in ${operationKey.upper}`,
          });

        response = newResponse;
      } else {
        response = method.responses["200"];
      }

      transform = yield* responseSchema(response.content);
    }

    const identifier = t.identifier(`${operationKey.upper}_Response`);

    ctx.schemas.set(identifier.name, [
      t.exportNamedDeclaration(
        t.variableDeclaration("const", [
          t.variableDeclarator(identifier, transform),
        ])
      ),
    ]);

    return {
      expression: identifier,
      typeReference: t.tsTypeReference(
        options.types.typeDecoded,
        t.tsTypeParameterInstantiation([t.tsTypeQuery(identifier)])
      ),
    };
  });

  const processSchema = Effect.fn(function* (schema: SchemaObject) {
    if (options.includeSchemas ?? true) {
      yield* ensureSchema(schema);
    }
  });

  const processOperation = Effect.fn(function* (
    operationKey: generationHelpers.OperationKey,
    path: string,
    _method: generationHelpers.HttpMethod,
    operation: OperationObject
  ) {
    if (options.includeOperations) {
      yield* ensureParametersSchema(operationKey, operation, path);
      yield* ensureResponseSchema(operationKey, operation);
    }
  });
  const decodeResponse = Effect.fn(function* (
    schema: t.Expression,
    response: t.Expression
  ) {
    return options.methods.decode(schema, response);
  });
  const encodeParameters = Effect.fn(function* (
    schema: t.Expression,
    response: t.Expression
  ) {
    return options.methods.encode(schema, response);
  });
  return {
    processSchema,
    processOperation,
    ensureParametersSchema,
    ensureResponseSchema,
    decodeResponse,
    encodeParameters,
    get schemaType() {
      return options.types.schema;
    },
  };
}
