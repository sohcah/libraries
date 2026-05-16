import type { OpenApiGenerator, OperationReference } from "../core.js";
import type * as t from "@babel/types";
import type { ImportExtensionsBehaviour } from "./ensureImport.ts";

export interface JsDocument {
  path: string;
  imports: t.ImportDeclaration[];
  importExtensions: ImportExtensionsBehaviour;
}

export const JsSchemaGeneratorExtension = Symbol("JsSchemaGeneratorExtension");
export type OpenApiJsSchemaGenerator = OpenApiGenerator & {
  [JsSchemaGeneratorExtension]: {
    getParameterType: (
      doc: JsDocument,
      ref: OperationReference,
    ) => Promise<t.TSType>;
    encodeParameters: (
      doc: JsDocument,
      ref: OperationReference,
      parameters: t.Expression,
    ) => Promise<t.Expression>;
    getResponseType: (
      doc: JsDocument,
      ref: OperationReference,
    ) => Promise<t.TSType>;
    parseResponse: (
      doc: JsDocument,
      ref: OperationReference,
      response: t.Expression,
    ) => Promise<t.Expression>;
  };
};
