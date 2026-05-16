import type { OpenApiConfig } from "../config.js";
import {
  JsSchemaGeneratorExtension,
  type JsDocument,
  type OpenApiJsSchemaGenerator,
} from "../js/index.js";
import type {
  OpenApiGenerator,
  ApiDocument,
  OperationReference,
} from "../core.js";
import * as t from "@babel/types";
import { writeFile } from "node:fs/promises";
import { generate } from "@babel/generator";
import { first, getOperationKey } from "../helpers.js";
import { stringLiteralOrIdentifier } from "../js/stringLiteralOrIdentifier.js";
import {
  ensureImport,
  type ImportExtensionsBehaviour,
} from "../js/ensureImport.ts";

interface ReactQueryGeneratorOptionsBase {
  output: string;

  /** @default "retain" */
  importExtensions?: ImportExtensionsBehaviour;
}

interface ReactQueryGeneratorInternalOptions
  extends ReactQueryGeneratorOptionsBase {
  schemaGenerator: OpenApiJsSchemaGenerator;
}

interface ReactQueryGeneratorOptions<T extends string>
  extends ReactQueryGeneratorOptionsBase {
  schemaGenerator: T;
}

function createQueryFn(): t.FunctionDeclaration {
  const paramsParam = t.restElement(t.identifier("params"));
  paramsParam.typeAnnotation = t.tsTypeAnnotation(t.tsTypeReference(t.identifier("P")));
  const fnParam  = t.identifier("fn");
  fnParam.typeAnnotation = t.tsTypeAnnotation(t.tsFunctionType(null, [
    paramsParam
  ], t.tsTypeAnnotation(
    t.tsTypeReference(
      t.identifier("Promise"),
      t.tsTypeParameterInstantiation([
       t.tsTypeReference(
        t.identifier("T"),
       ),
      ]),
    ))));
  const fn = t.functionDeclaration(
    t.identifier("queryFn"),
    [
      fnParam
    ],
    t.blockStatement([
      t.returnStatement(
        t.arrowFunctionExpression(
          [paramsParam],
          t.blockStatement([
            t.variableDeclaration("const", [
              t.variableDeclarator(t.identifier("result"), t.awaitExpression(
                t.callExpression(
                t.memberExpression(
                  t.callExpression(fnParam, [
                    t.spreadElement(t.identifier("params"))
                  ]),
                  t.identifier("then")
                ),
                [
                  t.identifier("getApiResult"),
                  t.identifier("getUnexpectedError"),
                ]
              )
              )),
            ]),
            t.ifStatement(
              t.binaryExpression(
                "===",
                t.memberExpression(t.identifier("result"), t.identifier("type")),
                t.stringLiteral("success"),
              ),
              t.returnStatement(
                t.memberExpression(t.identifier("result"), t.identifier("data")),
              ),
            ),
            t.throwStatement(
              t.memberExpression(t.identifier("result"), t.identifier("error")),
            ),
          ]),
          true
        )
      )
    ]),
  );
  fn.typeParameters = t.tsTypeParameterDeclaration([
    t.tsTypeParameter(
      t.tsTypeLiteral([
        t.tsPropertySignature(
          t.identifier("code"),
          t.tsTypeAnnotation(t.tsNumberKeyword()),
        ),
        t.tsPropertySignature(
          t.identifier("contentType"),
          t.tsTypeAnnotation(t.tsStringKeyword()),
        ),
        t.tsPropertySignature(
          t.identifier("response"),
          t.tsTypeAnnotation(t.tsUnknownKeyword()),
        ),
      ]),
      undefined,
      "T"
    ),
    t.tsTypeParameter(
      t.tsArrayType(
        t.tsUnknownKeyword(),
      ),
      undefined,
      "P"
    ),
  ]);
  return fn;
}

export class ReactQueryGenerator implements OpenApiGenerator {
  #options: ReactQueryGeneratorInternalOptions;
  #apiBody: t.ClassBody = t.classBody([
    t.classPrivateProperty(t.privateName(t.identifier("fetch"))),
    t.classMethod(
      "constructor",
      t.identifier("constructor"),
      [
        Object.assign(t.identifier("fetch"), {
          typeAnnotation: t.tsTypeAnnotation(
            t.tsFunctionType(
              null,
              [
                Object.assign(t.identifier("path"), {
                  typeAnnotation: t.tsTypeAnnotation(t.tsStringKeyword()),
                }),
                Object.assign(t.identifier("options"), {
                  typeAnnotation: t.tsTypeAnnotation(
                    t.tsTypeReference(t.identifier("RequestInit")),
                  ),
                }),
              ],
              t.tsTypeAnnotation(
                t.tsTypeReference(
                  t.identifier("Promise"),
                  t.tsTypeParameterInstantiation([
                    t.tsTypeReference(t.identifier("Response")),
                  ]),
                ),
              ),
            ),
          ),
        }),
      ],
      t.blockStatement([
        t.expressionStatement(
          t.assignmentExpression(
            "=",
            t.memberExpression(
              t.identifier("this"),
              t.privateName(t.identifier("fetch")),
            ),
            t.identifier("fetch"),
          ),
        ),
      ]),
    ),
  ]);

  #doc: JsDocument;

  constructor(options: ReactQueryGeneratorInternalOptions) {
    this.#options = options;
    this.#doc = {
      path: options.output,
      imports: [],
      importExtensions: options.importExtensions ?? "retain",
    };
  }

  async visitOperation(
    document: ApiDocument,
    ref: OperationReference,
  ): Promise<void> {
    const operationKey = getOperationKey(ref, "lower");

    const fetchCall = t.awaitExpression(
      t.callExpression(
        t.memberExpression(
          t.thisExpression(),
          t.privateName(t.identifier("fetch")),
        ),
        [
          t.memberExpression(t.identifier("params"), t.identifier("path")),
          t.objectExpression([
            t.objectProperty(
              t.identifier("method"),
              t.memberExpression(
                t.identifier("params"),
                t.identifier("method"),
              ),
            ),
            t.objectProperty(
              t.identifier("headers"),
              t.memberExpression(
                t.identifier("params"),
                t.identifier("headers"),
              ),
            ),
            t.objectProperty(
              t.identifier("body"),
              t.memberExpression(t.identifier("params"), t.identifier("body")),
            ),
          ]),
        ],
      ),
    );

    const parametersType = await this.#options.schemaGenerator[
      JsSchemaGeneratorExtension
    ].getParameterType(this.#doc, ref);
    const parameters = t.identifier("parameters");
    parameters.typeAnnotation = t.tsTypeAnnotation(parametersType);

    this.#apiBody.body.push(
      t.classMethod(
        "method",
        stringLiteralOrIdentifier(operationKey),
        [parameters],
        t.blockStatement([
          t.variableDeclaration("const", [
            t.variableDeclarator(
              t.identifier("params"),
              t.awaitExpression(
                await this.#options.schemaGenerator[
                  JsSchemaGeneratorExtension
                ].encodeParameters(this.#doc, ref, t.identifier("parameters")),
              ),
            ),
          ]),
          t.variableDeclaration("const", [
            t.variableDeclarator(t.identifier("response"), fetchCall),
          ]),
          t.variableDeclaration("const", [
            t.variableDeclarator(
              t.identifier("result"),
              t.awaitExpression(
                await this.#options.schemaGenerator[
                  JsSchemaGeneratorExtension
                ].parseResponse(this.#doc, ref, t.identifier("response")),
              ),
            ),
          ]),
          t.returnStatement(t.identifier("result")),
        ]),
        false,
        false,
        false,
        true,
      ),
    );

    const isMutation =
      ref.methodKey !== "get" &&
      ref.methodKey !== "head" &&
      ref.methodKey !== "options" &&
      !ref.operation.tags?.some((i) => i.toLowerCase() === "query");

    const parametersWithSkipToken = t.identifier("parameters");
    parametersWithSkipToken.typeAnnotation = t.tsTypeAnnotation(
      t.tsUnionType([
        parametersType,
        t.tsTypeReference(
          ensureImport(
            this.#doc.imports,
            "SkipToken",
            "@tanstack/react-query",
            true,
          ),
        ),
      ]),
    );

    const optionsCall = t.callExpression(
      ensureImport(
        this.#doc.imports,
        isMutation ? "mutationOptions" : "queryOptions",
        "@tanstack/react-query",
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
                      t.stringLiteral(first(operationKey, "upper")),
                      parametersWithSkipToken,
                    ]),
                    t.tsTypeReference(
                      ensureImport(
                        this.#doc.imports,
                        "QueryKey",
                        "@tanstack/react-query",
                        true,
                      ),
                    ),
                  ),
                ),
              ]),
          isMutation
            ? t.objectProperty(
                t.identifier("mutationFn"),
                t.callExpression(
                  t.identifier("queryFn"),
                  [
                    t.arrowFunctionExpression(
                      [parameters],
                      t.callExpression(
                        t.memberExpression(
                          t.thisExpression(),
                          t.identifier(operationKey),
                        ),
                        [parameters],
                      ),
                      true,
                    ),
                  ]
                )
              )
            : t.objectProperty(
                t.identifier("queryFn"),
                t.conditionalExpression(
                  t.binaryExpression(
                    "===",
                    parametersWithSkipToken,
                    ensureImport(
                      this.#doc.imports,
                      "skipToken",
                      "@tanstack/react-query",
                    ),
                  ),
                  ensureImport(
                    this.#doc.imports,
                    "skipToken",
                    "@tanstack/react-query",
                  ),
                  t.callExpression(
                    t.identifier("queryFn"),
                    [
                      t.arrowFunctionExpression(
                        [],
                        t.awaitExpression(t.callExpression(
                          t.memberExpression(
                            t.thisExpression(),
                            t.identifier(operationKey),
                          ),
                          [parametersWithSkipToken],
                        )),
                        true,
                      ),
                    ]
                  ),
                ),
              ),
        ]),
      ],
    );
    const resultTypeReference = t.tsIndexedAccessType(
      t.tsTypeReference(
        t.identifier("Extract"),
        t.tsTypeParameterInstantiation([
          await this.#options.schemaGenerator[
            JsSchemaGeneratorExtension
          ].getResponseType(this.#doc, ref),
          t.tsTypeLiteral([
            t.tsPropertySignature(
              t.identifier("code"),
              t.tsTypeAnnotation(t.tsLiteralType(t.numericLiteral(200))),
            ),
          ]),
        ]),
      ),
      t.tsLiteralType(t.stringLiteral("response")),
    );
    optionsCall.typeParameters = t.tsTypeParameterInstantiation([
      resultTypeReference,
      t.tsTypeReference(t.identifier("Error")),
      ...(isMutation ? [
        parametersType
      ] : [
        resultTypeReference,
        t.tsTypeReference(t.identifier("QueryKey")),
      ]),
    ]);

    this.#apiBody.body.push(
      t.classMethod(
        "method",
        t.identifier(operationKey + (isMutation ? "Mutation" : "Query")),
        isMutation ? [] : [parametersWithSkipToken],
        t.blockStatement([
          t.returnStatement(
            optionsCall
          ),
        ]),
      ),
    );
  }

  async complete(): Promise<void> {
    const program = t.program([
      ...this.#doc.imports,
      createQueryFn(),
      t.exportNamedDeclaration(
        t.classDeclaration(t.identifier("Api"), null, this.#apiBody),
      ),
    ]);
    await writeFile(this.#options.output, generate(program).code);
  }
}

export function createReactQueryGenerator<const T extends string>(
  options: ReactQueryGeneratorOptions<T>,
) {
  return (config: OpenApiConfig<{ [value in T]: OpenApiJsSchemaGenerator }>) =>
    new ReactQueryGenerator({
      ...options,
      schemaGenerator: config.builders[options.schemaGenerator],
    });
}
