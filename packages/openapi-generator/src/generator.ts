import * as t from "@babel/types";
import { Context, Data, Effect } from "effect";
import type { YieldWrap } from "effect/Utils";
import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
import {
  getSchemaGenerator,
  SchemaGeneratorContext,
  type SchemaGenerator,
  type SchemaGeneratorFormat,
} from "./schema.js";

type APIDocument<T extends object> =
  | OpenAPIV3_1.Document<T>
  | OpenAPIV3.Document<T>;

type ReferenceObject = OpenAPIV3.ReferenceObject | OpenAPIV3_1.ReferenceObject;

type SchemaObject = OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject;

type OperationObject = OpenAPIV3_1.OperationObject | OpenAPIV3.OperationObject;

type ExpressionWithType = {
  expression: t.Expression;
  typeDecoded: t.TSType;
  typeEncoded: t.TSType;
  typeMeta?: {
    readonly?: boolean;
  };
};

const equivalentType = (type: t.TSType) => ({
  typeDecoded: type,
  typeEncoded: type,
});

type ImportReference = {
  type: "import";
  name: string;
  from: string;
};

export type GeneratorOptions = {
  operations?: {
    filter?: (operation: OperationObject) => boolean;
  };

  schemas?: {
    /** @default "zod" */
    format?: SchemaGeneratorFormat;
    experimental_includeTypes?: boolean;
    custom?: (schema: SchemaObject) => ImportReference | null;
  };
};

interface GeneratorData {
  document: APIDocument<object>;
  options: GeneratorOptions;
  imports: t.ImportDeclaration[];
  schemas: Map<string, t.Statement[]>;
  processingSchemas: Set<string>;
  processingSchemaTypes: Set<string>;
  apiMethods: t.ObjectProperty[];
}

class GeneratorContext extends Context.Tag("GeneratorContext")<
  GeneratorContext,
  GeneratorData
>() {}

function defaultParseJson(
  schemaGenerator: SchemaGenerator
): (expression: t.Expression) => t.Expression {
  return (expression) =>
    schemaGenerator.transformer({
      encoded: schemaGenerator.schema.string,
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
            schemaGenerator.transformerCatch(t.identifier("error"))
          )
        ),
      ]),
      encode: t.callExpression(
        t.memberExpression(t.identifier("JSON"), t.identifier("stringify")),
        [t.identifier("from")]
      ),
    });
}

export class NotImplementedError extends Data.Error<{ message: string }> {}

const addImport = Effect.fn(function* (name: string, from: string) {
  const ctx = yield* GeneratorContext;

  const existingImport = ctx.imports.find((i) => i.source.value === from);
  if (existingImport) {
    if (
      !existingImport.specifiers.find(
        (s) => s.type === "ImportSpecifier" && s.local.name === name
      )
    ) {
      existingImport.specifiers.push(
        t.importSpecifier(t.identifier(name), t.identifier(name))
      );
    }
    return;
  }

  ctx.imports.push(
    t.importDeclaration(
      [t.importSpecifier(t.identifier(name), t.identifier(name))],
      t.stringLiteral(from)
    )
  );
});

const getKey = Effect.fn(function* (name: string) {
  if (!name)
    return yield* new NotImplementedError({
      message: "key for empty name",
    });
  const safeName = name.replace(/[^a-zA-Z0-9]/g, "_");
  return {
    lower: `${safeName[0]!.toLowerCase()}${safeName.slice(1)}`,
    upper: `${safeName[0]!.toUpperCase()}${safeName.slice(1)}`,
  };
});

const getBaseEffectSchema = Effect.fn(function* (
  schema: SchemaObject | ReferenceObject
) {
  const ctx = yield* GeneratorContext;
  const schemaGenerator = yield* SchemaGeneratorContext;

  if ("$ref" in schema) {
    const ref = schema.$ref;
    if (!ref.startsWith("#/components/schemas/"))
      return yield* new NotImplementedError({
        message: `$ref ${ref}`,
      });
    const schemaName = ref.slice("#/components/schemas/".length);
    const schemaKey = yield* getKey(schemaName);

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
            schemaGenerator.types.typeDecoded,
            t.tsTypeParameterInstantiation([
              t.tsTypeQuery(t.identifier(schemaKey.upper)),
            ])
          ),
          typeEncoded: t.tsTypeReference(
            schemaGenerator.types.typeEncoded,
            t.tsTypeParameterInstantiation([
              t.tsTypeQuery(t.identifier(schemaKey.upper)),
            ])
          ),
        };
      }
      ctx.processingSchemaTypes.add(schemaName);
      const typeSchema = yield* getSchema(resolvedSchema);
      fn.returnType = t.tsTypeAnnotation(
        t.tsTypeReference(
          schemaGenerator.types.schema,
          t.tsTypeParameterInstantiation([
            typeSchema.typeDecoded,
            typeSchema.typeEncoded,
          ])
        )
      );
      ctx.processingSchemaTypes.delete(schemaName);
      return {
        expression: schemaGenerator.modifiers.lazy(fn),
        typeDecoded: t.tsTypeReference(
          schemaGenerator.types.typeDecoded,
          t.tsTypeParameterInstantiation([
            t.tsTypeQuery(t.identifier(schemaKey.upper)),
          ])
        ),
        typeEncoded: t.tsTypeReference(
          schemaGenerator.types.typeEncoded,
          t.tsTypeParameterInstantiation([
            t.tsTypeQuery(t.identifier(schemaKey.upper)),
          ])
        ),
      };
    }

    if (!ctx.schemas.has(schemaName)) {
      ctx.processingSchemas.add(schemaName);

      const schemaExpression = yield* getSchema(resolvedSchema);

      const schemaKeyIdentifier = t.identifier(schemaKey.upper);
      if (ctx.options.schemas?.experimental_includeTypes) {
        schemaKeyIdentifier.typeAnnotation = t.tsTypeAnnotation(
          t.tsTypeReference(
            schemaGenerator.types.schema,
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
              schemaGenerator.types.typeDecoded,
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
        schemaGenerator.types.typeDecoded,
        t.tsTypeParameterInstantiation([
          t.tsTypeQuery(t.identifier(schemaKey.upper)),
        ])
      ),
      typeEncoded: t.tsTypeReference(
        schemaGenerator.types.typeEncoded,
        t.tsTypeParameterInstantiation([
          t.tsTypeQuery(t.identifier(schemaKey.upper)),
        ])
      ),
    };
  }

  const customResult = ctx.options.schemas?.custom?.(schema);

  if (customResult) {
    yield* addImport(customResult.name, customResult.from);
    return {
      expression: t.identifier(customResult.name),
      typeDecoded: t.tsTypeReference(
        schemaGenerator.types.typeDecoded,
        t.tsTypeParameterInstantiation([
          t.tsTypeQuery(t.identifier(customResult.name)),
        ])
      ),
      typeEncoded: t.tsTypeReference(
        schemaGenerator.types.typeEncoded,
        t.tsTypeParameterInstantiation([
          t.tsTypeQuery(t.identifier(customResult.name)),
        ])
      ),
    };
  }

  if (schema.enum) {
    const unsupportedEnumValue = schema.enum.find((i) => typeof i !== "string");
    if (unsupportedEnumValue !== undefined) {
      return yield* new NotImplementedError({
        message: `Unsupported 'enum' value: ${JSON.stringify(unsupportedEnumValue)}`,
      });
    }
    return {
      expression: schemaGenerator.schema.enum(
        schema.enum.map((e) => t.stringLiteral(e as string))
      ),
      ...equivalentType(
        t.tsUnionType(
          schema.enum.map((e) => t.tsLiteralType(t.stringLiteral(e as string)))
        )
      ),
    };
  }

  switch (schema.type) {
    case "boolean": {
      return {
        expression: schemaGenerator.schema.boolean,
        ...equivalentType(t.tsBooleanKeyword()),
      };
    }
    case "string": {
      let expression: ExpressionWithType = {
        expression: schemaGenerator.schema.string,
        ...equivalentType(t.tsStringKeyword()),
      };
      if (schema.pattern) {
        expression.expression = schemaGenerator.modifiers.regex(
          expression.expression,
          schema.pattern
        );
      }
      return expression;
    }
    case "number": {
      return {
        expression: schemaGenerator.schema.number,
        ...equivalentType(t.tsNumberKeyword()),
      };
    }
    case "integer": {
      return {
        expression: schemaGenerator.schema.integer,
        ...equivalentType(t.tsNumberKeyword()),
      };
    }
    case "object": {
      const object = t.objectExpression([]);
      const objectTypeDecoded = t.tsTypeLiteral([]);
      const objectTypeEncoded = t.tsTypeLiteral([]);
      for (const [propertyKey, property] of Object.entries(
        schema.properties ?? {}
      )) {
        let propertySchema = yield* getSchema(property);
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
        if (!schema.required?.includes(propertyKey)) {
          propertySchema.expression = schemaGenerator.modifiers.optional(
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
          t.addComment(objectProperty, "leading", `* ${property.description}`);
        }
        object.properties.push(objectProperty);
        objectTypeDecoded.members.push(decodedMember);
        objectTypeEncoded.members.push(encodedMember);
      }
      return {
        expression: t.callExpression(schemaGenerator.schema.object, [object]),
        typeDecoded: objectTypeDecoded,
        typeEncoded: objectTypeEncoded,
      };
    }
    case "array": {
      const itemsSchema = yield* getSchema(schema.items);
      let expression: t.Expression = t.callExpression(
        schemaGenerator.schema.array,
        [itemsSchema.expression]
      );
      let typeDecoded: t.TSType = t.tsArrayType(itemsSchema.typeDecoded);
      let typeEncoded: t.TSType = t.tsArrayType(itemsSchema.typeEncoded);
      if (schemaGenerator.supportsImmutability) {
        if (itemsSchema.typeMeta?.readonly) {
          expression = schemaGenerator.modifiers.immutable(expression);
          typeDecoded = t.tsTypeOperator(typeDecoded, "readonly");
          typeEncoded = t.tsTypeOperator(typeEncoded, "readonly");
        } else {
          expression = schemaGenerator.modifiers.mutable(expression);
        }
      }
      return {
        expression,
        typeDecoded,
        typeEncoded,
      };
    }
    case "null": {
      return {
        expression: schemaGenerator.schema.null,
        ...equivalentType(t.tsNullKeyword()),
      };
    }
    case undefined: {
      return {
        expression: schemaGenerator.schema.unknown,
        ...equivalentType(t.tsUnknownKeyword()),
      }
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
  const schemaGenerator = yield* SchemaGeneratorContext;

  if ("$ref" in schema) return expression;

  const modified = { ...expression };

  // OpenAPI v3.0 support
  if ("nullable" in schema && schema.nullable) {
    modified.expression = schemaGenerator.modifiers.nullable(
      modified.expression
    );
    modified.typeDecoded = t.tsUnionType([
      modified.typeDecoded,
      t.tsNullKeyword(),
    ]);
    modified.typeEncoded = t.tsUnionType([
      modified.typeEncoded,
      t.tsNullKeyword(),
    ]);
  }

  if (schemaGenerator.supportsImmutability) {
    if (schema.readOnly) {
      modified.expression = schemaGenerator.modifiers.immutable(
        modified.expression
      );
      modified.typeMeta ??= {};
      modified.typeMeta.readonly = true;
    } else {
      modified.expression = schemaGenerator.modifiers.mutable(
        modified.expression
      );
    }
  }

  return modified;
});

const getSchema = Effect.fn(function* (
  schema: SchemaObject | ReferenceObject
): Generator<
  | YieldWrap<
      Effect.Effect<
        ExpressionWithType,
        NotImplementedError,
        GeneratorContext | SchemaGeneratorContext
      >
    >
  | YieldWrap<Context.Tag<SchemaGeneratorContext, SchemaGenerator>>,
  ExpressionWithType,
  never
> {
  const schemaGenerator = yield* SchemaGeneratorContext;

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
      expression: schemaGenerator.schema.union(
        expressions.map((e) => e.expression)
      ),
      typeDecoded: t.tsUnionType(expressions.map((e) => e.typeDecoded)),
      typeEncoded: t.tsUnionType(expressions.map((e) => e.typeEncoded)),
    };
  }

  return expressions[0]!;
});

const getParametersSchema = Effect.fn(function* (
  operationId: string,
  method: OperationObject
) {
  const ctx = yield* GeneratorContext;
  const schemaGenerator = yield* SchemaGeneratorContext;
  const identifier = t.identifier(`${operationId}_Parameters`);
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
    let expression = (yield* getSchema(parameter.schema)).expression;
    if (!parameter.required) {
      expression = schemaGenerator.modifiers.optional(expression);
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
      queryArray.elements.push(
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
            (
              schemaGenerator.builtins.parseJson ??
              defaultParseJson(schemaGenerator)
            )((yield* getSchema(schema)).expression)
          )
        );
        break body;
      } else if (contentKey === "application/octet-stream") {
        object.properties.push(
          t.objectProperty(
            t.identifier("data"),
            t.callExpression(schemaGenerator.schema.instanceOf, [
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

  const decodedSchema = t.callExpression(schemaGenerator.schema.object, [
    object,
  ]);

  const transform = schemaGenerator.transformer({
    encoded: t.identifier("ParametersSchema"),
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
  return identifier;
});

const getResponseSchema = Effect.fn(function* (
  operationId: string,
  method: OperationObject
) {
  const schemaGenerator = yield* SchemaGeneratorContext;

  if (!method.responses?.["200"]) return null;

  if ("$ref" in method.responses["200"])
    return yield* new NotImplementedError({
      message: "$ref in response",
    });

  if (!method.responses["200"].content) return null;

  if (!method.responses["200"].content["application/json"]?.schema)
    return yield* new NotImplementedError({
      message: `response without 'application/json' content schema in ${operationId}`,
    });

  const schema = method.responses["200"].content["application/json"].schema;

  const identifier = t.identifier(`${operationId}_Response`);

  const decodedSchema = (yield* getSchema(schema)).expression;

  const transform = (
    schemaGenerator.builtins.parseJson ?? defaultParseJson(schemaGenerator)
  )(decodedSchema);

  (yield* GeneratorContext).schemas.set(identifier.name, [
    t.exportNamedDeclaration(
      t.variableDeclaration("const", [
        t.variableDeclarator(identifier, transform),
      ])
    ),
  ]);

  return identifier;
});

const build = Effect.fn(function* () {
  const ctx = yield* GeneratorContext;
  const schemaGenerator = yield* SchemaGeneratorContext;

  for (const [pathKey, path] of Object.entries(ctx.document.paths ?? {})) {
    if (!path) continue;
    if (path.$ref) {
      return yield* new NotImplementedError({
        message: "$ref in path",
      });
    }
    for (const methodKey of ["get", "post", "put", "delete"] as const) {
      const method = path[methodKey];
      if (!method) continue;

      const operationId = yield* getKey(
        method.operationId ?? `${pathKey}_${methodKey}`
      );

      const parametersSchema = yield* getParametersSchema(
        operationId.upper,
        method
      );

      const responseSchema = yield* getResponseSchema(
        operationId.upper,
        method
      );

      const parameters = t.identifier("parameters");
      parameters.typeAnnotation = t.tsTypeAnnotation(
        t.tsTypeReference(
          schemaGenerator.types.typeDecoded,
          t.tsTypeParameterInstantiation([t.tsTypeQuery(parametersSchema)])
        )
      );

      const isMutation = methodKey !== "get";

      const objectProperty = t.objectProperty(
        t.identifier(operationId.lower),
        t.arrowFunctionExpression(
          isMutation ? [] : [parameters],
          t.callExpression(
            t.identifier(isMutation ? "mutationOptions" : "queryOptions"),
            [
              t.objectExpression([
                ...(isMutation
                  ? []
                  : [
                      t.objectProperty(
                        t.identifier("queryKey"),
                        t.arrayExpression([
                          t.stringLiteral(operationId.upper),
                          parameters,
                        ])
                      ),
                    ]),
                t.objectProperty(
                  t.identifier(isMutation ? "mutationFn" : "queryFn"),
                  t.arrowFunctionExpression(
                    isMutation ? [parameters] : [],
                    t.awaitExpression(
                      t.callExpression(t.identifier("makeRequest"), [
                        t.objectExpression([
                          t.objectProperty(
                            t.identifier("method"),
                            t.stringLiteral(methodKey)
                          ),
                          t.objectProperty(
                            t.identifier("path"),
                            t.stringLiteral(pathKey)
                          ),
                          t.objectProperty(
                            t.identifier("parameterSchema"),
                            parametersSchema
                          ),
                          t.objectProperty(
                            t.identifier("parameters"),
                            parameters,
                            false,
                            true
                          ),
                          ...(responseSchema
                            ? [
                                t.objectProperty(
                                  t.identifier("responseSchema"),
                                  responseSchema
                                ),
                              ]
                            : []),
                        ]),
                      ])
                    ),
                    true
                  )
                ),
              ]),
            ]
          )
        )
      );

      const commentLines = [];
      if (method.summary) commentLines.push(`### ${method.summary}`);
      if (method.description) commentLines.push(`${method.description}`);
      if (commentLines.length) {
        t.addComment(
          objectProperty,
          "leading",
          `*\n${commentLines.join("\n")}\n*`
        );
      }

      ctx.apiMethods.push(objectProperty);
    }
  }

  return t.program([
    ...ctx.imports,
    t.exportNamedDeclaration(
      t.variableDeclaration("const", [
        t.variableDeclarator(
          t.identifier("ParametersSchema"),
          t.callExpression(schemaGenerator.schema.object, [
            t.objectExpression([
              t.objectProperty(
                t.identifier("query"),
                schemaGenerator.modifiers.optional(
                  t.callExpression(schemaGenerator.schema.instanceOf, [
                    t.identifier("URLSearchParams"),
                  ])
                )
              ),
              t.objectProperty(
                t.identifier("headers"),
                schemaGenerator.modifiers.optional(
                  t.callExpression(schemaGenerator.schema.instanceOf, [
                    t.identifier("Headers"),
                  ])
                )
              ),
              t.objectProperty(
                t.identifier("path"),
                schemaGenerator.modifiers.optional(
                  schemaGenerator.schema.record(
                    schemaGenerator.schema.string,
                    schemaGenerator.schema.string
                  )
                )
              ),
              t.objectProperty(
                t.identifier("body"),
                schemaGenerator.modifiers.optional(
                  schemaGenerator.schema.union([
                    schemaGenerator.schema.string,
                    t.callExpression(schemaGenerator.schema.instanceOf, [
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
    yield* getMakeRequest(),
    ...[...ctx.schemas.values()].flat(),
    t.exportNamedDeclaration(
      t.functionDeclaration(
        t.identifier("useApi"),
        [],
        t.blockStatement([
          t.returnStatement(t.objectExpression(ctx.apiMethods)),
        ])
      )
    ),
  ]);
});

const getMakeRequest = Effect.fn(function* () {
  const schemaGenerator = yield* SchemaGeneratorContext;
  const optionsParam = t.objectPattern([
    t.objectProperty(
      t.identifier("method"),
      t.identifier("method"),
      false,
      true
    ),
    t.objectProperty(t.identifier("path"), t.identifier("path"), false, true),
    t.objectProperty(
      t.identifier("parameterSchema"),
      t.identifier("parameterSchema"),
      false,
      true
    ),
    t.objectProperty(
      t.identifier("parameters"),
      t.identifier("parameters"),
      false,
      true
    ),
    t.objectProperty(
      t.identifier("responseSchema"),
      t.identifier("responseSchema"),
      false,
      true
    ),
  ]);
  optionsParam.typeAnnotation = t.tsTypeAnnotation(
    t.tsTypeLiteral([
      t.tsPropertySignature(
        t.identifier("method"),
        t.tsTypeAnnotation(t.tsStringKeyword())
      ),
      t.tsPropertySignature(
        t.identifier("path"),
        t.tsTypeAnnotation(t.tsStringKeyword())
      ),
      t.tsPropertySignature(
        t.identifier("parameterSchema"),
        t.tsTypeAnnotation(
          t.tsTypeReference(
            schemaGenerator.types.schema,
            t.tsTypeParameterInstantiation([
              t.tsTypeReference(t.identifier("TParams")),
              t.tsTypeLiteral([
                Object.assign(
                  t.tsPropertySignature(
                    t.identifier("query"),
                    t.tsTypeAnnotation(
                      t.tsTypeReference(t.identifier("URLSearchParams"))
                    )
                  ),
                  { optional: true }
                ),
                Object.assign(
                  t.tsPropertySignature(
                    t.identifier("body"),
                    t.tsTypeAnnotation(
                      t.tsUnionType([
                        t.tsStringKeyword(),
                        t.tsTypeReference(t.identifier("Blob")),
                      ])
                    )
                  ),
                  { optional: true }
                ),
              ]),
            ])
          )
        )
      ),
      t.tsPropertySignature(
        t.identifier("parameters"),
        t.tsTypeAnnotation(t.tsTypeReference(t.identifier("TParams")))
      ),
      Object.assign(
        t.tsPropertySignature(
          t.identifier("responseSchema"),
          t.tsTypeAnnotation(
            t.tsTypeReference(
              schemaGenerator.types.schema,
              t.tsTypeParameterInstantiation([
                t.tsTypeReference(t.identifier("TResponse")),
                t.tsStringKeyword(),
              ])
            )
          )
        ),
        { optional: true }
      ),
    ])
  );

  const func = t.functionDeclaration(
    t.identifier("makeRequest"),
    [optionsParam],
    t.blockStatement([
      t.variableDeclaration("const", [
        t.variableDeclarator(
          t.objectPattern([
            t.objectProperty(t.identifier("query"), t.identifier("query")),
            t.objectProperty(t.identifier("body"), t.identifier("body")),
          ]),
          schemaGenerator.methods.encode(
            t.identifier("parameterSchema"),
            t.identifier("parameters")
          )
        ),
      ]),
      t.variableDeclaration("const", [
        t.variableDeclarator(
          t.identifier("url"),
          t.newExpression(t.identifier("URL"), [
            t.identifier("path"),
            t.stringLiteral("http://localhost:3000"),
          ])
        ),
      ]),
      t.ifStatement(
        t.identifier("query"),
        t.blockStatement([
          t.expressionStatement(
            t.assignmentExpression(
              "=",
              t.memberExpression(t.identifier("url"), t.identifier("search")),
              t.callExpression(
                t.memberExpression(
                  t.identifier("query"),
                  t.identifier("toString")
                ),
                []
              )
            )
          ),
        ])
      ),
      t.variableDeclaration("const", [
        t.variableDeclarator(
          t.identifier("response"),
          t.awaitExpression(
            t.callExpression(t.identifier("fetch"), [
              t.identifier("url"),
              t.objectExpression([
                t.objectProperty(
                  t.identifier("method"),
                  t.identifier("method"),
                  false,
                  true
                ),
                t.objectProperty(
                  t.identifier("body"),
                  t.identifier("body"),
                  false,
                  true
                ),
              ]),
            ])
          )
        ),
      ]),
      t.ifStatement(
        t.unaryExpression(
          "!",
          t.memberExpression(t.identifier("response"), t.identifier("ok"))
        ),
        t.blockStatement([
          t.throwStatement(
            t.newExpression(t.identifier("Error"), [
              t.awaitExpression(
                t.callExpression(
                  t.memberExpression(
                    t.identifier("response"),
                    t.identifier("text")
                  ),
                  []
                )
              ),
            ])
          ),
        ])
      ),
      t.ifStatement(
        t.unaryExpression("!", t.identifier("responseSchema")),
        t.blockStatement([t.returnStatement(t.nullLiteral())])
      ),
      t.returnStatement(
        schemaGenerator.methods.decode(
          t.identifier("responseSchema"),
          t.awaitExpression(
            t.callExpression(
              t.memberExpression(
                t.identifier("response"),
                t.identifier("text")
              ),
              []
            )
          )
        )
      ),
    ]),
    false,
    true
  );
  func.typeParameters = t.tsTypeParameterDeclaration([
    t.tsTypeParameter(undefined, undefined, "TParams"),
    t.tsTypeParameter(undefined, undefined, "TResponse"),
  ]);

  return t.exportNamedDeclaration(func);
});

export const generate = Effect.fn(function* (
  document: APIDocument<object>,
  options: GeneratorOptions
) {
  const schemaGenerator = getSchemaGenerator(options.schemas?.format ?? "zod");

  const context: GeneratorData = {
    document,
    options,
    imports: [
      ...schemaGenerator.imports,
      t.importDeclaration(
        [
          t.importSpecifier(
            t.identifier("queryOptions"),
            t.identifier("queryOptions")
          ),
          t.importSpecifier(
            t.identifier("mutationOptions"),
            t.identifier("mutationOptions")
          ),
          t.importSpecifier(t.identifier("useQuery"), t.identifier("useQuery")),
          t.importSpecifier(
            t.identifier("useMutation"),
            t.identifier("useMutation")
          ),
        ],
        t.stringLiteral("@tanstack/react-query")
      ),
    ],
    schemas: new Map(),
    processingSchemas: new Set(),
    processingSchemaTypes: new Set(),
    apiMethods: [],
  };
  return yield* build().pipe(
    Effect.provideService(GeneratorContext, context),
    Effect.provideService(SchemaGeneratorContext, schemaGenerator)
  );
});
