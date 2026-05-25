import type { OpenApiConfig } from "../config.js";
import {
  JsRequestGeneratorExtension,
  JsSchemaGeneratorExtension,
  type JsDocument,
  type OpenApiJsRequestGenerator,
  type OpenApiJsSchemaGenerator,
} from "../js/index.js";
import type { ApiDocument, OperationReference, SchemaReferenceType } from "../core.js";
import * as t from "@babel/types";
import { writeFile } from "node:fs/promises";
import { generate } from "@babel/generator";
import { getOperationKey } from "../helpers.js";
import { stringLiteralOrIdentifier } from "../js/stringLiteralOrIdentifier.js";
import {
  ensureImport,
  relativeImportPathFromDocument,
  type ImportExtensionsBehaviour,
} from "../js/ensureImport.ts";

interface FetchGeneratorOptionsBase {
  output: string;

  /** @default "FetchApi" */
  className?: string;

  /** @default "retain" */
  importExtensions?: ImportExtensionsBehaviour;
}

interface FetchGeneratorInternalOptions extends FetchGeneratorOptionsBase {
  schemaGenerator: OpenApiJsSchemaGenerator;
}

interface FetchGeneratorOptions<T extends string> extends FetchGeneratorOptionsBase {
  schemaGenerator: T;
}

export class FetchGenerator implements OpenApiJsRequestGenerator {
  #options: FetchGeneratorInternalOptions;
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
                    t.tsTypeLiteral([
                      t.tsPropertySignature(
                        t.identifier("method"),
                        t.tsTypeAnnotation(t.tsStringKeyword()),
                      ),
                      Object.assign(
                        t.tsPropertySignature(
                          t.identifier("headers"),
                          t.tsTypeAnnotation(t.tsTypeReference(t.identifier("Headers"))),
                        ),
                        { optional: true },
                      ),
                      Object.assign(
                        t.tsPropertySignature(
                          t.identifier("body"),
                          t.tsTypeAnnotation(t.tsTypeReference(t.identifier("BodyInit"))),
                        ),
                        { optional: true },
                      ),
                    ]),
                  ),
                }),
              ],
              t.tsTypeAnnotation(
                t.tsTypeReference(
                  t.identifier("Promise"),
                  t.tsTypeParameterInstantiation([t.tsTypeReference(t.identifier("Response"))]),
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
            t.memberExpression(t.identifier("this"), t.privateName(t.identifier("fetch"))),
            t.identifier("fetch"),
          ),
        ),
      ]),
    ),
  ]);

  #doc: JsDocument;

  constructor(options: FetchGeneratorInternalOptions) {
    this.#options = options;
    this.#doc = {
      path: options.output,
      imports: [],
      importExtensions: options.importExtensions ?? "retain",
    };
  }
  visitSchema?: ((document: ApiDocument, ref: SchemaReferenceType) => Promise<void>) | undefined;

  async visitOperation(document: ApiDocument, ref: OperationReference): Promise<void> {
    const operationKey = getOperationKey(ref, "lower");

    const fetchCall = t.awaitExpression(
      t.callExpression(
        t.memberExpression(t.thisExpression(), t.privateName(t.identifier("fetch"))),
        [
          t.memberExpression(t.identifier("params"), t.identifier("path")),
          t.objectExpression([
            t.objectProperty(
              t.identifier("method"),
              t.memberExpression(t.identifier("params"), t.identifier("method")),
            ),
            t.objectProperty(
              t.identifier("headers"),
              t.memberExpression(t.identifier("params"), t.identifier("headers")),
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
              t.identifier("params"),
              t.awaitExpression(
                await this.#options.schemaGenerator[JsSchemaGeneratorExtension.encodeParameters](
                  this.#doc,
                  ref,
                  t.identifier("parameters"),
                ),
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
                await this.#options.schemaGenerator[JsSchemaGeneratorExtension.parseResponse](
                  this.#doc,
                  ref,
                  t.identifier("response"),
                ),
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
  }

  get #className() {
    return this.#options.className ?? "FetchApi";
  }

  async complete(): Promise<void> {
    const program = t.program([
      ...this.#doc.imports,
      t.exportNamedDeclaration(
        t.classDeclaration(t.identifier(this.#className), null, this.#apiBody),
      ),
    ]);
    await writeFile(this.#options.output, generate(program).code);
  }

  [JsSchemaGeneratorExtension.getParameterType](doc: JsDocument, ref: OperationReference) {
    return this.#options.schemaGenerator[JsSchemaGeneratorExtension.getParameterType](doc, ref);
  }

  [JsSchemaGeneratorExtension.getResponseType](doc: JsDocument, ref: OperationReference) {
    return this.#options.schemaGenerator[JsSchemaGeneratorExtension.getResponseType](doc, ref);
  }

  async [JsRequestGeneratorExtension.getRequesterType](doc: JsDocument) {
    ensureImport(
      doc.imports,
      this.#className,
      relativeImportPathFromDocument(doc, this.#doc),
      true,
    );
    return t.tsTypeReference(t.identifier(this.#className));
  }

  async [JsRequestGeneratorExtension.getRequestCall](
    doc: JsDocument,
    requester: t.Expression,
    parameters: t.Expression,
    ref: OperationReference,
  ) {
    const operationKey = getOperationKey(ref, "lower");
    return t.callExpression(t.memberExpression(requester, t.identifier(operationKey)), [
      parameters,
    ]);
  }
}

export function createFetchGenerator<const T extends string>(options: FetchGeneratorOptions<T>) {
  return (config: OpenApiConfig<{ [value in T]: OpenApiJsSchemaGenerator }>) =>
    new FetchGenerator({
      ...options,
      schemaGenerator: config.builders[options.schemaGenerator],
    });
}
