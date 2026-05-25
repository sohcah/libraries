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
          t.tsPropertySignature(
            t.identifier("contentType"),
            t.tsTypeAnnotation(t.tsStringKeyword()),
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

  #doc: JsDocument;

  constructor(options: ReactQueryGeneratorInternalOptions) {
    this.#options = options;
    this.#doc = {
      path: options.output,
      imports: [],
      importExtensions: options.importExtensions ?? "retain",
    };
    this.#apiBody = t.classBody([t.classPrivateProperty(t.privateName(t.identifier("api")))]);
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
  }

  async complete(): Promise<void> {
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
        ],
        t.blockStatement([
          t.expressionStatement(
            t.assignmentExpression(
              "=",
              t.memberExpression(t.thisExpression(), t.privateName(t.identifier("api"))),
              t.identifier("api"),
            ),
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
    ]);
    await writeFile(this.#options.output, generate(program).code);
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
