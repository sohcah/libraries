import * as generationHelpers from "./helpers.js";
import type {
  ImportReference,
  OpenApiClientGenerator,
  OpenApiSchemaGenerator,
} from "./types.js";
import { Effect } from "effect";
import * as t from "@babel/types";
import { DocumentContext } from "../context.js";

export interface OpenApiClientGeneratorOptions {
  schema: OpenApiSchemaGenerator;
  /**
   * If provided, responses from the
   */
  responseGeneric?: ImportReference;
}

export function createReactQueryClientGenerator(
  options: OpenApiClientGeneratorOptions
): OpenApiClientGenerator {
  const ensureApi = Effect.fn(function* () {
    const ctx = yield* DocumentContext;
    if (!ctx.schemas.has("Api")) {
      const makeRequest = t.identifier("makeRequest");
      const makeRequestOptions = t.identifier("options");
      makeRequestOptions.typeAnnotation = t.tsTypeAnnotation(
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
            t.identifier("parametersSchema"),
            t.tsTypeAnnotation(
              t.tsTypeReference(
                options.schema.schemaType,
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
                    Object.assign(
                      t.tsPropertySignature(
                        t.identifier("headers"),
                        t.tsTypeAnnotation(
                          t.tsTypeReference(t.identifier("Headers"))
                        )
                      ),
                      { optional: true }
                    ),
                    Object.assign(
                      t.tsPropertySignature(
                        t.identifier("path"),
                        t.tsTypeAnnotation(
                          t.tsTypeReference(
                            t.identifier("Record<string, string>")
                          )
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
                  options.schema.schemaType,
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
      makeRequest.typeAnnotation = t.tsTypeAnnotation(
        t.tsFunctionType(
          t.tsTypeParameterDeclaration([
            t.tsTypeParameter(null, null, "TParams"),
            t.tsTypeParameter(null, null, "TResponse"),
          ]),
          [makeRequestOptions],
          t.tsTypeAnnotation(
            t.tsTypeReference(
              t.identifier(
                options.responseGeneric
                  ? `Promise<${(yield* generationHelpers.ensureImport(options.responseGeneric.name, options.responseGeneric.from)).name}<TResponse>>`
                  : "Promise<TResponse>"
              )
            )
          )
        )
      );
      ctx.schemas.set("Api", [
        t.exportNamedDeclaration(
          t.classDeclaration(
            t.identifier("Api"),
            null,
            t.classBody([
              t.classPrivateProperty(t.privateName(makeRequest)),
              t.classMethod(
                "constructor",
                t.identifier("constructor"),
                [makeRequest],
                t.blockStatement([
                  t.expressionStatement(
                    t.assignmentExpression(
                      "=",
                      t.memberExpression(
                        t.thisExpression(),
                        t.privateName(makeRequest)
                      ),
                      makeRequest
                    )
                  ),
                ])
              ),
            ])
          )
        ),
      ]);
    }
    return (
      (ctx.schemas.get("Api")![0] as t.ExportNamedDeclaration)
        .declaration as t.ClassDeclaration
    ).body as t.ClassBody;
  });
  return {
    initialize: Effect.fn(function* () {
      yield* ensureApi();
      if (options.schema.initialize) {
        yield* options.schema.initialize();
      }
    }),
    processOperation: Effect.fn(
      function* (operationKey, path, method, operation) {
        const ctx = yield* DocumentContext;

        const parametersSchema = yield* options.schema.ensureParametersSchema(
          operationKey,
          operation
        );

        const responseSchema = yield* options.schema.ensureResponseSchema(
          operationKey,
          operation
        );

        const parameters = t.identifier("parameters");
        parameters.typeAnnotation = t.tsTypeAnnotation(
          parametersSchema.typeReference
        );

        const isMutation = method !== "get";

        const fnBody = t.awaitExpression(
          t.callExpression(
            t.memberExpression(
              t.thisExpression(),
              t.privateName(t.identifier("makeRequest"))
            ),
            [
              t.objectExpression([
                t.objectProperty(
                  t.identifier("method"),
                  t.stringLiteral(method)
                ),
                t.objectProperty(t.identifier("path"), t.stringLiteral(path)),
                t.objectProperty(
                  t.identifier("parametersSchema"),
                  parametersSchema.expression,
                  false,
                  true
                ),
                t.objectProperty(t.identifier("parameters"), parameters),
                ...(responseSchema
                  ? [
                      t.objectProperty(
                        t.identifier("responseSchema"),
                        responseSchema.expression
                      ),
                    ]
                  : []),
              ]),
            ]
          )
        );

        const doMethod = t.classMethod(
          "method",
          t.identifier(operationKey.lower),
          [parameters],
          t.blockStatement([t.returnStatement(fnBody)]),
          false,
          false,
          false,
          true
        );
        const queryMethod = t.classMethod(
          "method",
          t.identifier(
            operationKey.lower + (isMutation ? "Mutation" : "Query")
          ),
          isMutation ? [] : [parameters],
          t.blockStatement([
            t.returnStatement(
              t.callExpression(
                yield* generationHelpers.ensureImport(
                  isMutation ? "mutationOptions" : "queryOptions",
                  "@tanstack/react-query"
                ),
                [
                  t.objectExpression([
                    ...(isMutation
                      ? []
                      : [
                          t.objectProperty(
                            t.identifier("queryKey"),
                            t.tsAsExpression(
                              t.arrayExpression([
                                t.stringLiteral(operationKey.upper),
                                parameters,
                              ]),
                              t.tsTypeReference(
                                yield* generationHelpers.ensureImport(
                                  "QueryKey",
                                  "@tanstack/react-query",
                                  true
                                )
                              )
                            )
                          ),
                        ]),
                    t.objectProperty(
                      t.identifier(isMutation ? "mutationFn" : "queryFn"),
                      t.arrowFunctionExpression(
                        isMutation ? [parameters] : [],
                        t.callExpression(
                          t.memberExpression(
                            t.thisExpression(),
                            t.identifier(operationKey.lower)
                          ),
                          [parameters]
                        ),
                        true
                      )
                    ),
                  ]),
                ]
              )
            ),
          ])
        );

        const commentLines = [];
        if (operation.summary) commentLines.push(`### ${operation.summary}`);
        if (operation.description)
          commentLines.push(`${operation.description}`);
        if (commentLines.length) {
          t.addComment(
            queryMethod,
            "leading",
            `*\n${commentLines.join("\n")}\n*`
          );
          t.addComment(doMethod, "leading", `*\n${commentLines.join("\n")}\n*`);
        }

        const api = yield* ensureApi();
        api.body.push(doMethod);
        api.body.push(queryMethod);
      }
    ),
  };
}
