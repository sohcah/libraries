import type { OpenApiConfig } from "../config.js";
import {
  JsRequestGeneratorExtension,
  JsSchemaGeneratorExtension,
  type JsDocument,
  type OpenApiJsRequestGenerator,
} from "../js/index.js";
import type { OpenApiGenerator, ApiDocument, OperationReference } from "../core.js";
import * as t from "@babel/types";
import { writeFile } from "node:fs/promises";
import { generate } from "@babel/generator";
import { first, getOperationKey } from "../helpers.js";
import {
  stringLiteralOrIdentifier,
  stringMemberExpression,
} from "../js/stringLiteralOrIdentifier.js";
import { ensureImport, type ImportExtensionsBehaviour } from "../js/ensureImport.js";

const DEFAULT_RUNTIME = "@sohcah/openapi-generator/react-query/std-runtime";

interface ReactQueryGeneratorOptionsBase {
  output: string;

  /** @default "retain" */
  importExtensions?: ImportExtensionsBehaviour;

  /**
   * An import to get `getApiResult` and `getUnexpectedResult` functions from.
   * @default "@sohcah/openapi-generator/react-query/std-runtime"
   */
  runtime?: string;

  /**
   * A list of operation keys that should be treated as infinite queries.
   */
  infiniteQueries?: string[];
}

interface ReactQueryGeneratorInternalOptions extends ReactQueryGeneratorOptionsBase {
  requestGenerator: OpenApiJsRequestGenerator;
}

interface ReactQueryGeneratorOptions<
  TRequest extends string,
> extends ReactQueryGeneratorOptionsBase {
  requestGenerator: TRequest;
}

function createQueryResultType(type: "Success" | "Error"): t.TSTypeAliasDeclaration {
  return t.tsTypeAliasDeclaration(
    t.identifier("Query" + type),
    t.tsTypeParameterDeclaration([
      t.tsTypeParameter(
        t.tsTypeLiteral([
          t.tsPropertySignature(t.identifier("code"), t.tsTypeAnnotation(t.tsNumberKeyword())),
          Object.assign(
            t.tsPropertySignature(
              t.identifier("contentType"),
              t.tsTypeAnnotation(t.tsStringKeyword()),
            ),
            { optional: true },
          ),
          t.tsPropertySignature(t.identifier("response"), t.tsTypeAnnotation(t.tsUnknownKeyword())),
        ]),
        null,
        "T",
      ),
    ]),
    t.tsIndexedAccessType(
      t.tsTypeReference(
        t.identifier("Extract"),
        t.tsTypeParameterInstantiation([
          t.tsUnionType([
            // ReturnType<typeof getApiResult<T>>
            t.tsTypeReference(
              t.identifier("ReturnType"),
              t.tsTypeParameterInstantiation([
                t.tsTypeQuery(
                  t.identifier("getApiResult"),
                  t.tsTypeParameterInstantiation([t.tsTypeReference(t.identifier("T"))]),
                ),
              ]),
            ),
            // ReturnType<typeof getUnexpectedResult>
            t.tsTypeReference(
              t.identifier("ReturnType"),
              t.tsTypeParameterInstantiation([t.tsTypeQuery(t.identifier("getUnexpectedResult"))]),
            ),
          ]),
          t.tsTypeLiteral([
            t.tsPropertySignature(
              t.identifier("type"),
              t.tsTypeAnnotation(
                t.tsLiteralType(t.stringLiteral(type === "Success" ? "success" : "error")),
              ),
            ),
          ]),
        ]),
      ),
      t.tsLiteralType(t.stringLiteral(type === "Success" ? "data" : "error")),
    ),
  );
}

export class ReactQueryGenerator implements OpenApiGenerator {
  #options: ReactQueryGeneratorInternalOptions;
  #apiBody: t.ClassBody;
  #apiInvalidatorBody: t.ClassBody;

  #doc: JsDocument;

  #infiniteQueriesConfig: Set<string>;
  #infiniteQueriesMatched: Set<string>;

  constructor(options: ReactQueryGeneratorInternalOptions) {
    this.#options = options;
    this.#doc = {
      path: options.output,
      imports: [],
      importExtensions: options.importExtensions ?? "retain",
    };
    this.#apiBody = t.classBody([
      t.classPrivateProperty(t.privateName(t.identifier("api"))),
      t.classPrivateProperty(t.privateName(t.identifier("queryClient"))),
    ]);

    this.#apiInvalidatorBody = this.#createInitialApiInvalidatorBody();

    this.#infiniteQueriesConfig = new Set(options.infiniteQueries ?? []);
    this.#infiniteQueriesMatched = new Set();
  }

  #queryClientTypeReference(): t.TSTypeReference {
    return t.tsTypeReference(
      ensureImport(this.#doc.imports, "QueryClient", "@tanstack/react-query", true),
    );
  }

  #createInitialApiInvalidatorBody(): t.ClassBody {
    const queryClientField = t.classPrivateProperty(t.privateName(t.identifier("queryClient")));
    queryClientField.typeAnnotation = t.tsTypeAnnotation(this.#queryClientTypeReference());

    const constructorMethod = t.classMethod(
      "constructor",
      t.identifier("constructor"),
      [
        Object.assign(t.identifier("queryClient"), {
          typeAnnotation: t.tsTypeAnnotation(this.#queryClientTypeReference()),
        }),
      ],
      t.blockStatement([
        t.expressionStatement(
          t.assignmentExpression(
            "=",
            t.memberExpression(t.thisExpression(), t.privateName(t.identifier("queryClient"))),
            t.identifier("queryClient"),
          ),
        ),
      ]),
    );

    return t.classBody([queryClientField, constructorMethod]);
  }

  async visitOperation(document: ApiDocument, ref: OperationReference): Promise<void> {
    const operationKey = getOperationKey(ref, "lower");

    const parametersType = await this.#options.requestGenerator[
      JsSchemaGeneratorExtension.getParameterType
    ](this.#doc, ref);
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
              t.identifier("result"),
              t.awaitExpression(
                t.callExpression(
                  t.memberExpression(
                    await this.#options.requestGenerator[
                      JsRequestGeneratorExtension.getRequestCall
                    ](
                      this.#doc,
                      t.memberExpression(t.thisExpression(), t.privateName(t.identifier("api"))),
                      parameters,
                      ref,
                    ),
                    t.identifier("then"),
                  ),
                  [t.identifier("getApiResult"), t.identifier("getUnexpectedResult")],
                ),
              ),
            ),
          ]),
          t.ifStatement(
            t.binaryExpression(
              "===",
              t.memberExpression(t.identifier("result"), t.identifier("type")),
              t.stringLiteral("success"),
            ),
            t.returnStatement(t.memberExpression(t.identifier("result"), t.identifier("data"))),
          ),
          t.throwStatement(t.memberExpression(t.identifier("result"), t.identifier("error"))),
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
          ensureImport(this.#doc.imports, "SkipToken", "@tanstack/react-query", true),
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
                      ensureImport(this.#doc.imports, "QueryKey", "@tanstack/react-query", true),
                    ),
                  ),
                ),
              ]),
          isMutation
            ? t.objectProperty(
                t.identifier("mutationFn"),
                // t.callExpression(t.identifier("queryFn"), [
                t.arrowFunctionExpression(
                  [parameters],
                  t.callExpression(stringMemberExpression(t.thisExpression(), operationKey), [
                    parameters,
                  ]),
                  true,
                ),
                // ]),
              )
            : t.objectProperty(
                t.identifier("queryFn"),
                t.conditionalExpression(
                  t.binaryExpression(
                    "===",
                    parametersWithSkipToken,
                    ensureImport(this.#doc.imports, "skipToken", "@tanstack/react-query"),
                  ),
                  ensureImport(this.#doc.imports, "skipToken", "@tanstack/react-query"),
                  t.arrowFunctionExpression(
                    [],
                    t.awaitExpression(
                      t.callExpression(stringMemberExpression(t.thisExpression(), operationKey), [
                        parametersWithSkipToken,
                      ]),
                    ),
                    true,
                  ),
                ),
              ),
        ]),
      ],
    );
    const responseType = t.tsTypeParameterInstantiation([
      await this.#options.requestGenerator[JsSchemaGeneratorExtension.getResponseType](
        this.#doc,
        ref,
      ),
    ]);
    const resultTypeReference = (type: "Success" | "Error") =>
      t.tsTypeReference(t.identifier("Query" + type), responseType);
    optionsCall.typeParameters = t.tsTypeParameterInstantiation([
      resultTypeReference("Success"),
      resultTypeReference("Error"),
      ...(isMutation
        ? [parametersType]
        : [resultTypeReference("Success"), t.tsTypeReference(t.identifier("QueryKey"))]),
    ]);

    const methodName = stringLiteralOrIdentifier(
      operationKey + (isMutation ? "Mutation" : "Query"),
    );
    this.#apiBody.body.push(
      t.classMethod(
        "method",
        methodName,
        isMutation ? [] : [parametersWithSkipToken],
        t.blockStatement([t.returnStatement(optionsCall)]),
        methodName.type === "StringLiteral",
      ),
    );

    if (!isMutation) {
      this.#apiInvalidatorBody.body.push(
        this.#buildInvalidatorMethod(operationKey, first(operationKey, "upper"), parametersType),
      );
    }

    if (this.#infiniteQueriesConfig.has(operationKey)) {
      if (isMutation) {
        throw new Error(
          `Operation "${operationKey}" is listed in infiniteQueries but is a mutation. ` +
            `Only query operations (GET/HEAD/OPTIONS, or operations tagged "query") can be infinite queries.`,
        );
      }
      this.#infiniteQueriesMatched.add(operationKey);

      const responseType = await this.#options.requestGenerator[
        JsSchemaGeneratorExtension.getResponseType
      ](this.#doc, ref);

      this.#apiBody.body.push(
        this.#buildInfiniteQueryMethod(operationKey, parametersType, responseType),
      );
    }
  }

  #buildInfiniteQueryMethod(
    operationKey: string,
    parametersType: t.TSType,
    responseType: t.TSType,
  ): t.ClassMethod {
    const queryKeyName = first(operationKey, "upper");

    const tPageParam = t.tsTypeReference(t.identifier("TPageParam"));

    const skipTokenTypeRef = () =>
      t.tsTypeReference(
        ensureImport(this.#doc.imports, "SkipToken", "@tanstack/react-query", true),
      );

    const querySuccessType = t.tsTypeReference(
      t.identifier("QuerySuccess"),
      t.tsTypeParameterInstantiation([responseType]),
    );

    // ((pageParam: TPageParam) => Parameters_ListUsers) | SkipToken
    const getParametersType = t.tsUnionType([
      t.tsParenthesizedType(
        t.tsFunctionType(
          null,
          [
            Object.assign(t.identifier("pageParam"), {
              typeAnnotation: t.tsTypeAnnotation(tPageParam),
            }),
          ],
          t.tsTypeAnnotation(parametersType),
        ),
      ),
      skipTokenTypeRef(),
    ]);

    // (lastPage, allPages, lastPageParam, allPageParams) => TPageParam | undefined | null
    const pageParamFnType = (pageParamName: string, allPageParamsName: string): t.TSFunctionType =>
      t.tsFunctionType(
        null,
        [
          Object.assign(t.identifier(pageParamName), {
            typeAnnotation: t.tsTypeAnnotation(querySuccessType),
          }),
          Object.assign(t.identifier("allPages"), {
            typeAnnotation: t.tsTypeAnnotation(t.tsArrayType(querySuccessType)),
          }),
          Object.assign(t.identifier(`${pageParamName}Param`), {
            typeAnnotation: t.tsTypeAnnotation(tPageParam),
          }),
          Object.assign(t.identifier(allPageParamsName), {
            typeAnnotation: t.tsTypeAnnotation(t.tsArrayType(tPageParam)),
          }),
        ],
        t.tsTypeAnnotation(t.tsUnionType([tPageParam, t.tsUndefinedKeyword(), t.tsNullKeyword()])),
      );

    const optionsTypeLiteral = t.tsTypeLiteral([
      t.tsPropertySignature(t.identifier("getParameters"), t.tsTypeAnnotation(getParametersType)),
      t.tsPropertySignature(t.identifier("initialPageParam"), t.tsTypeAnnotation(tPageParam)),
      t.tsPropertySignature(
        t.identifier("getNextPageParam"),
        t.tsTypeAnnotation(pageParamFnType("lastPage", "allPageParams")),
      ),
      Object.assign(
        t.tsPropertySignature(
          t.identifier("getPreviousPageParam"),
          t.tsTypeAnnotation(pageParamFnType("firstPage", "allPageParams")),
        ),
        { optional: true },
      ),
      Object.assign(
        t.tsPropertySignature(t.identifier("maxPages"), t.tsTypeAnnotation(t.tsNumberKeyword())),
        { optional: true },
      ),
    ]);

    const optionsParam = Object.assign(t.identifier("options"), {
      typeAnnotation: t.tsTypeAnnotation(optionsTypeLiteral),
    });

    // const getParameters = options.getParameters;
    const getParametersDecl = t.variableDeclaration("const", [
      t.variableDeclarator(
        t.identifier("getParameters"),
        t.memberExpression(t.identifier("options"), t.identifier("getParameters")),
      ),
    ]);

    const skipTokenIdent = () =>
      ensureImport(this.#doc.imports, "skipToken", "@tanstack/react-query");

    // getParameters === skipToken ? skipToken : getParameters(options.initialPageParam)
    const initialPageParamsExpr = t.conditionalExpression(
      t.binaryExpression("===", t.identifier("getParameters"), skipTokenIdent()),
      skipTokenIdent(),
      t.callExpression(t.identifier("getParameters"), [
        t.memberExpression(t.identifier("options"), t.identifier("initialPageParam")),
      ]),
    );

    // queryKey: ["ListUsers", <initialPageParamsExpr>, "infinite"] as QueryKey
    const queryKeyExpr = t.tsAsExpression(
      t.arrayExpression([
        t.stringLiteral(queryKeyName),
        initialPageParamsExpr,
        t.stringLiteral("infinite"),
      ]),
      t.tsTypeReference(ensureImport(this.#doc.imports, "QueryKey", "@tanstack/react-query", true)),
    );

    // queryFn: getParameters === skipToken
    //   ? skipToken
    //   : async (ctx) => this.<operationKey>(getParameters(ctx.pageParam))
    const queryFnExpr = t.conditionalExpression(
      t.binaryExpression("===", t.identifier("getParameters"), skipTokenIdent()),
      skipTokenIdent(),
      t.arrowFunctionExpression(
        [t.identifier("ctx")],
        t.callExpression(stringMemberExpression(t.thisExpression(), operationKey), [
          t.callExpression(t.identifier("getParameters"), [
            t.tsAsExpression(
              t.memberExpression(t.identifier("ctx"), t.identifier("pageParam")),
              t.tsTypeReference(t.identifier("TPageParam")),
            ),
          ]),
        ]),
        true,
      ),
    );

    const infiniteQueryOptionsCall = t.callExpression(
      ensureImport(this.#doc.imports, "infiniteQueryOptions", "@tanstack/react-query"),
      [
        t.objectExpression([
          t.objectProperty(t.identifier("queryKey"), queryKeyExpr),
          t.objectProperty(t.identifier("queryFn"), queryFnExpr),
          t.objectProperty(
            t.identifier("initialPageParam"),
            t.memberExpression(t.identifier("options"), t.identifier("initialPageParam")),
          ),
          t.objectProperty(
            t.identifier("getNextPageParam"),
            t.memberExpression(t.identifier("options"), t.identifier("getNextPageParam")),
          ),
          t.objectProperty(
            t.identifier("getPreviousPageParam"),
            t.memberExpression(t.identifier("options"), t.identifier("getPreviousPageParam")),
          ),
          t.objectProperty(
            t.identifier("maxPages"),
            t.memberExpression(t.identifier("options"), t.identifier("maxPages")),
          ),
        ]),
      ],
    );

    const methodName = stringLiteralOrIdentifier(operationKey + "InfiniteQuery");

    const method = t.classMethod(
      "method",
      methodName,
      [optionsParam],
      t.blockStatement([getParametersDecl, t.returnStatement(infiniteQueryOptionsCall)]),
      methodName.type === "StringLiteral",
    );
    method.typeParameters = t.tsTypeParameterDeclaration([
      t.tsTypeParameter(null, null, "TPageParam"),
    ]);
    return method;
  }

  async complete(): Promise<void> {
    const unknownInfiniteQueries = [...this.#infiniteQueriesConfig].filter(
      (name) => !this.#infiniteQueriesMatched.has(name),
    );
    if (unknownInfiniteQueries.length > 0) {
      throw new Error(
        `infiniteQueries references unknown operation${unknownInfiniteQueries.length === 1 ? "" : "s"}: ${unknownInfiniteQueries.map((n) => JSON.stringify(n)).join(", ")}`,
      );
    }

    this.#apiBody.body.unshift(
      t.classMethod(
        "constructor",
        t.identifier("constructor"),
        [
          Object.assign(t.identifier("api"), {
            typeAnnotation: t.tsTypeAnnotation(
              await this.#options.requestGenerator[JsRequestGeneratorExtension.getRequesterType](
                this.#doc,
              ),
            ),
          }),
          Object.assign(t.identifier("queryClient"), {
            typeAnnotation: t.tsTypeAnnotation(this.#queryClientTypeReference()),
          }),
        ],
        t.blockStatement([
          t.expressionStatement(
            t.assignmentExpression(
              "=",
              t.memberExpression(t.thisExpression(), t.privateName(t.identifier("api"))),
              t.identifier("api"),
            ),
          ),
          t.expressionStatement(
            t.assignmentExpression(
              "=",
              t.memberExpression(t.thisExpression(), t.privateName(t.identifier("queryClient"))),
              t.identifier("queryClient"),
            ),
          ),
        ]),
      ),
    );

    this.#apiBody.body.push(
      t.classMethod(
        "get",
        t.identifier("invalidate"),
        [],
        t.blockStatement([
          t.returnStatement(
            t.newExpression(t.identifier("ApiInvalidator"), [
              t.memberExpression(t.thisExpression(), t.privateName(t.identifier("queryClient"))),
            ]),
          ),
        ]),
      ),
    );

    const runtime = this.#options.runtime ?? DEFAULT_RUNTIME;
    ensureImport(this.#doc.imports, "getApiResult", runtime);
    ensureImport(this.#doc.imports, "getUnexpectedResult", runtime);
    const queryResultTypeSuccess = createQueryResultType("Success");
    const queryResultTypeError = createQueryResultType("Error");
    const program = t.program([
      ...this.#doc.imports,
      queryResultTypeSuccess,
      queryResultTypeError,
      t.exportNamedDeclaration(t.classDeclaration(t.identifier("Api"), null, this.#apiBody)),
      t.classDeclaration(t.identifier("ApiInvalidator"), null, this.#apiInvalidatorBody),
    ]);
    await writeFile(this.#options.output, generate(program).code);
  }

  #buildInvalidatorMethod(
    operationKey: string,
    queryKeyName: string,
    parametersType: t.TSType,
  ): t.ClassMethod {
    const parameters = Object.assign(t.identifier("parameters"), {
      optional: true,
      typeAnnotation: t.tsTypeAnnotation(
        t.tsTypeReference(
          t.identifier("Partial"),
          t.tsTypeParameterInstantiation([parametersType]),
        ),
      ),
    });

    const methodName = stringLiteralOrIdentifier(operationKey);

    // ["QueryKeyName", ...(parameters ? [parameters] : [])]
    const queryKeyArray = t.arrayExpression([
      t.stringLiteral(queryKeyName),
      t.spreadElement(
        t.conditionalExpression(
          t.identifier("parameters"),
          t.arrayExpression([t.identifier("parameters")]),
          t.arrayExpression([]),
        ),
      ),
    ]);

    // return this.#queryClient.invalidateQueries({ queryKey: [...] });
    const body = t.blockStatement([
      t.returnStatement(
        t.awaitExpression(
          t.callExpression(
            t.memberExpression(
              t.memberExpression(t.thisExpression(), t.privateName(t.identifier("queryClient"))),
              t.identifier("invalidateQueries"),
            ),
            [t.objectExpression([t.objectProperty(t.identifier("queryKey"), queryKeyArray)])],
          ),
        ),
      ),
    ]);

    return t.classMethod(
      "method",
      methodName,
      [parameters],
      body,
      methodName.type === "StringLiteral",
      false,
      false,
      true,
    );
  }
}

export function createReactQueryGenerator<const TRequest extends string>(
  options: ReactQueryGeneratorOptions<TRequest>,
) {
  return (config: OpenApiConfig<{ [value in TRequest]: OpenApiJsRequestGenerator }>) =>
    new ReactQueryGenerator({
      ...options,
      requestGenerator: config.builders[options.requestGenerator],
    });
}
