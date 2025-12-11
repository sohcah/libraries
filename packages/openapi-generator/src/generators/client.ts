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
}

export function createReactQueryClientGenerator(
  options: OpenApiClientGeneratorOptions
): OpenApiClientGenerator {
  const ensureApi = Effect.fn(function* () {
    const ctx = yield* DocumentContext;
    if (!ctx.schemas.has("Api")) {
      const fetch = t.identifier("fetch");
      const fetchPath = t.identifier("path");
      fetchPath.typeAnnotation = t.tsTypeAnnotation(t.tsStringKeyword());
      const fetchOptions = t.identifier("options");
      fetchOptions.typeAnnotation = t.tsTypeAnnotation(
        t.tsTypeLiteral([
          t.tsPropertySignature(
            t.identifier("method"),
            t.tsTypeAnnotation(t.tsStringKeyword())
          ),
          Object.assign(
            t.tsPropertySignature(
              t.identifier("headers"),
              t.tsTypeAnnotation(t.tsTypeReference(t.identifier("Headers")))
            ),
            { optional: true }
          ),
          Object.assign(
            t.tsPropertySignature(
              t.identifier("body"),
              t.tsTypeAnnotation(
                t.tsUnionType([
                  t.tsTypeReference(t.identifier("string")),
                  t.tsTypeReference(t.identifier("Blob")),
                  t.tsTypeReference(t.identifier("FormData")),
                  t.tsTypeReference(t.identifier("URLSearchParams")),
                ])
              )
            ),
            { optional: true }
          ),
        ])
      );
      fetch.typeAnnotation = t.tsTypeAnnotation(
        t.tsFunctionType(
          null,
          [fetchPath, fetchOptions],
          t.tsTypeAnnotation(
            t.tsTypeReference(
              t.identifier("Promise"),
              t.tsTypeParameterInstantiation([
                t.tsTypeReference(t.identifier("Response")),
              ])
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
              t.classPrivateProperty(t.privateName(fetch)),
              t.classMethod(
                "constructor",
                t.identifier("constructor"),
                [fetch],
                t.blockStatement([
                  t.expressionStatement(
                    t.assignmentExpression(
                      "=",
                      t.memberExpression(
                        t.thisExpression(),
                        t.privateName(fetch)
                      ),
                      fetch
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
        const parametersSchema = yield* options.schema.ensureParametersSchema(
          operationKey,
          operation,
          path
        );

        const responseSchema = yield* options.schema.ensureResponseSchema(
          operationKey,
          operation
        );

        const parameters = t.identifier("parameters");
        parameters.typeAnnotation = t.tsTypeAnnotation(
          parametersSchema.typeReference
        );

        const parametersWithSkipToken = t.identifier("parameters");
        parametersWithSkipToken.typeAnnotation = t.tsTypeAnnotation(
          t.tsUnionType([
            parametersSchema.typeReference,
            t.tsTypeReference(
              yield* generationHelpers.ensureImport(
                "SkipToken",
                "@tanstack/react-query",
                true
              )
            ),
          ])
        );

        const isMutation =
          method !== "get" && method !== "head" && method !== "options";

        const fetchCall = t.awaitExpression(
          t.callExpression(
            t.memberExpression(
              t.thisExpression(),
              t.privateName(t.identifier("fetch"))
            ),
            [
              t.memberExpression(t.identifier("params"), t.identifier("path")),
              t.objectExpression([
                t.objectProperty(
                  t.identifier("method"),
                  t.stringLiteral(method)
                ),
                t.objectProperty(
                  t.identifier("headers"),
                  t.memberExpression(
                    t.identifier("params"),
                    t.identifier("headers")
                  )
                ),
                t.objectProperty(
                  t.identifier("body"),
                  t.memberExpression(
                    t.identifier("params"),
                    t.identifier("body")
                  )
                ),
              ]),
            ]
          )
        );

        const doMethod = t.classMethod(
          "method",
          t.identifier(operationKey.lower),
          [parameters],
          t.blockStatement([
            t.variableDeclaration("const", [
              t.variableDeclarator(
                t.identifier("params"),
                t.awaitExpression(
                  yield* options.schema.encodeParameters(
                    parametersSchema.expression,
                    t.identifier("parameters")
                  )
                )
              ),
            ]),
            t.variableDeclaration("const", [
              t.variableDeclarator(t.identifier("response"), fetchCall),
            ]),
            t.returnStatement(
              t.awaitExpression(
                yield* options.schema.decodeResponse(
                  responseSchema.expression,
                  t.identifier("response")
                )
              )
            ),
          ]),
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
          isMutation ? [] : [parametersWithSkipToken],
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
                                parametersWithSkipToken,
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
                    isMutation
                      ? t.objectProperty(
                          t.identifier("mutationFn"),
                          t.arrowFunctionExpression(
                            [parameters],
                            t.callExpression(
                              t.memberExpression(
                                t.thisExpression(),
                                t.identifier(operationKey.lower)
                              ),
                              [parameters]
                            ),
                            true
                          )
                        )
                      : t.objectProperty(
                          t.identifier(isMutation ? "mutationFn" : "queryFn"),
                          t.conditionalExpression(
                            t.binaryExpression(
                              "===",
                              parametersWithSkipToken,
                              yield* generationHelpers.ensureImport(
                                "skipToken",
                                "@tanstack/react-query"
                              )
                            ),
                            yield* generationHelpers.ensureImport(
                              "skipToken",
                              "@tanstack/react-query"
                            ),
                            t.arrowFunctionExpression(
                              [],
                              t.callExpression(
                                t.memberExpression(
                                  t.thisExpression(),
                                  t.identifier(operationKey.lower)
                                ),
                                [parametersWithSkipToken]
                              ),
                              true
                            )
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
