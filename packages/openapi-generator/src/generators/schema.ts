import * as t from "@babel/types";
import type {
  OperationObject,
  ReferenceObject,
  SchemaObject,
} from "../types.js";
import { Effect } from "effect";
import { DocumentContext } from "../context.js";
import * as generationHelpers from "./helpers.js";
import type { YieldWrap } from "effect/Utils";
import type { ImportReference, OpenApiSchemaGenerator } from "./types.js";
import { NotImplementedError } from "../errors.js";

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
    encode: t.Expression | t.BlockStatement;
  }) => t.Expression;
  transformerCatch: (expression: t.Expression) => t.BlockStatement;
  builtins: {
    parseJson?: (expression: t.Expression) => t.Expression;
  };
  methods: {
    encode: (schema: t.Expression, value: t.Expression) => t.Expression;
    decode: (schema: t.Expression, value: t.Expression) => t.Expression;
    parse: (schema: t.Expression, value: t.Expression) => t.Expression;
  };
  supportsImmutability: boolean;
}

type ExpressionWithType = {
  expression: t.Expression;
  typeDecoded: t.TSType;
  typeEncoded: t.TSType;
  typeMeta: {
    readonly?: boolean;
    optional?: boolean;
  };
};

const equivalentType = (type: t.TSType) => ({
  typeDecoded: type,
  typeEncoded: type,
});

function defaultParseJson(
  options: DefaultSchemaGeneratorOptions
): (expression: t.Expression) => t.Expression {
  return (expression) =>
    options.transformer({
      encoded: options.schema.string,
      decoded: expression,
      decode: t.blockStatement([
        t.tryStatement(
          t.blockStatement([
            t.returnStatement(
              t.callExpression(
                t.memberExpression(t.identifier("JSON"), t.identifier("parse")),
                [t.identifier("from")]
              )
            ),
          ]),
          t.catchClause(
            Object.assign(t.identifier("error"), {
              typeAnnotation: t.tsTypeAnnotation(t.tsUnknownKeyword()),
            }),
            options.transformerCatch(t.identifier("error"))
          )
        ),
      ]),
      encode: t.callExpression(
        t.memberExpression(t.identifier("JSON"), t.identifier("stringify")),
        [t.identifier("from")]
      ),
    });
}

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
                  t.objectProperty(
                    t.identifier("query"),
                    options.modifiers.optional(
                      t.callExpression(options.schema.instanceOf, [
                        t.identifier("URLSearchParams"),
                      ])
                    )
                  ),
                  t.objectProperty(
                    t.identifier("headers"),
                    options.modifiers.optional(
                      t.callExpression(options.schema.instanceOf, [
                        t.identifier("Headers"),
                      ])
                    )
                  ),
                  t.objectProperty(
                    t.identifier("path"),
                    options.modifiers.optional(
                      options.schema.record(
                        options.schema.string,
                        options.schema.string
                      )
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
        typeMeta,
      };
    }

    if (schema.deprecated) {
      if (options.deprecationHandling === "optional") {
        typeMeta.optional = true;
      } else {
        return {
          expression: options.modifiers.optional(options.schema.unknown),
          ...equivalentType(t.tsUnionType([t.tsUnknownKeyword(), t.tsUndefinedKeyword()])),
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

    if (schema.enum) {
      const unsupportedEnumValue = schema.enum.find(
        (i) => typeof i !== "string"
      );
      if (unsupportedEnumValue !== undefined) {
        return yield* new NotImplementedError({
          message: `Unsupported 'enum' value: ${JSON.stringify(unsupportedEnumValue)}`,
        });
      }
      return {
        expression: options.schema.enum(
          schema.enum.map((e) => t.stringLiteral(e as string))
        ),
        ...equivalentType(
          t.tsUnionType(
            schema.enum.map((e) =>
              t.tsLiteralType(t.stringLiteral(e as string))
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
        const object = t.objectExpression([]);
        const objectTypeDecoded = t.tsTypeLiteral([]);
        const objectTypeEncoded = t.tsTypeLiteral([]);
        for (const [propertyKey, property] of Object.entries(
          schema.properties ?? {}
        )) {
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
          if (propertySchema.typeMeta?.optional || !schema.required?.includes(propertyKey)) {
            propertySchema.expression = options.modifiers.optional(
              propertySchema.expression
            );
            decodedMember.optional = true;
            encodedMember.optional = true;
          }
          const objectProperty = t.objectProperty(
            t.identifier(propertyKey),
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

    // OpenAPI v3.0 support
    if ("nullable" in schema && schema.nullable) {
      modified.expression = options.modifiers.nullable(modified.expression);
      modified.typeDecoded = t.tsUnionType([
        modified.typeDecoded,
        t.tsNullKeyword(),
      ]);
      modified.typeEncoded = t.tsUnionType([
        modified.typeEncoded,
        t.tsNullKeyword(),
      ]);
    }

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
    method: OperationObject
  ) {
    const ctx = yield* DocumentContext;
    const identifier = t.identifier(`${operationKey.upper}_Parameters`);
    const object = t.objectExpression([]);

    const queryArray = t.arrayExpression([]);
    const pathObject = t.objectExpression([]);
    const headerArray = t.arrayExpression([]);
    let hasBody = false;

    for (const parameter of method.parameters ?? []) {
      if ("$ref" in parameter) {
        return yield* new NotImplementedError({
          message: "$ref in parameter",
        });
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
        t.identifier(parameter.name),
        expression
      );
      if (parameter.description) {
        t.addComment(objectProperty, "leading", `* ${parameter.description}`);
      }
      object.properties.push(objectProperty);
      if (parameter.in === "query") {
        const param = t.memberExpression(
          t.identifier("from"),
          t.identifier(parameter.name)
        );
        if ("type" in parameter.schema && parameter.schema.type === "array") {
          queryArray.elements.push(
            t.spreadElement(
              t.logicalExpression(
                "??",
              Object.assign(
                t.optionalCallExpression(
                  t.optionalMemberExpression(param, t.identifier("map"), false, true),
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
                  false,
                ),
                {
                  typeParameters: t.tsTypeParameterInstantiation([
                    t.tsTypeReference(t.identifier("[string, string]")),
                  ]),
                }
              ),
              t.arrayExpression([])
            ),
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
        pathObject.properties.push(
          t.objectProperty(
            t.identifier(parameter.name),
            t.callExpression(t.identifier("String"), [
              t.memberExpression(
                t.identifier("from"),
                t.identifier(parameter.name)
              ),
            ])
          )
        );
      } else if (parameter.in === "header") {
        headerArray.elements.push(
          t.arrayExpression([
            t.stringLiteral(parameter.name),
            t.callExpression(t.identifier("String"), [
              t.memberExpression(
                t.identifier("from"),
                t.identifier(parameter.name)
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

    body: if (method.requestBody) {
      if ("$ref" in method.requestBody) {
        return yield* new NotImplementedError({
          message: "$ref in requestBody",
        });
      }
      // console.info(method.requestBody);
      for (const contentKey in method.requestBody.content) {
        hasBody = true;
        const schema = method.requestBody.content[contentKey]?.schema;
        if (!!schema && contentKey === "application/json") {
          object.properties.push(
            t.objectProperty(
              t.identifier("data"),
              (options.builtins.parseJson ?? defaultParseJson(options))(
                (yield* ensureSchema(schema)).expression
              )
            )
          );
          break body;
        } else if (contentKey === "application/octet-stream") {
          object.properties.push(
            t.objectProperty(
              t.identifier("data"),
              t.callExpression(options.schema.instanceOf, [
                t.identifier("Blob"),
              ])
            )
          );
          break body;
        }
      }
      return yield* new NotImplementedError({
        message: `No supported requestBody type (${Object.keys(
          method.requestBody.content
        ).join(", ")})`,
      });
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
        ...(queryArray.elements.length
          ? [
              t.objectProperty(
                t.identifier("query"),
                t.newExpression(t.identifier("URLSearchParams"), [queryArray])
              ),
            ]
          : []),
        ...(pathObject.properties.length
          ? [t.objectProperty(t.identifier("path"), pathObject)]
          : []),
        ...(headerArray.elements.length
          ? [
              t.objectProperty(
                t.identifier("header"),
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

  const ensureResponseSchema = Effect.fn(function* (
    operationKey: generationHelpers.OperationKey,
    method: OperationObject
  ) {
    const ctx = yield* DocumentContext;

    if (!method.responses?.["200"]) return null;

    if ("$ref" in method.responses["200"])
      return yield* new NotImplementedError({
        message: "$ref in response",
      });

    if (!method.responses["200"].content) return null;

    if (!method.responses["200"].content["application/json"]?.schema)
      return yield* new NotImplementedError({
        message: `response without 'application/json' content schema in ${operationKey.upper}`,
      });

    const schema = method.responses["200"].content["application/json"].schema;

    const identifier = t.identifier(`${operationKey.upper}_Response`);

    const decodedSchema = (yield* ensureSchema(schema)).expression;

    const transform = (options.builtins.parseJson ?? defaultParseJson(options))(
      decodedSchema
    );

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
    _path: string,
    _method: "get" | "post" | "put" | "delete",
    operation: OperationObject
  ) {
    if (options.includeOperations) {
      yield* ensureParametersSchema(operationKey, operation);
      yield* ensureResponseSchema(operationKey, operation);
    }
  });
  return {
    processSchema,
    processOperation,
    ensureParametersSchema,
    ensureResponseSchema,
    get schemaType() {
      return options.types.schema;
    },
  };
}
