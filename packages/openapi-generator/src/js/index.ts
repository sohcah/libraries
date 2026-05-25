import type { OpenApiGenerator, OperationReference } from "../core.js";
import type * as t from "@babel/types";
import type { ImportExtensionsBehaviour } from "./ensureImport.ts";

export interface JsDocument {
  path: string;
  imports: t.ImportDeclaration[];
  importExtensions: ImportExtensionsBehaviour;
}

const getParameterType = Symbol("JsSchemaGeneratorExtension:getParameterType");
const encodeParameters = Symbol("JsSchemaGeneratorExtension:encodeParameters");
const getResponseType = Symbol("JsSchemaGeneratorExtension:getResponseType");
const parseResponse = Symbol("JsSchemaGeneratorExtension:parseResponse");
export const JsSchemaGeneratorExtension = Object.freeze({
  getParameterType,
  encodeParameters,
  getResponseType,
  parseResponse,
} as const);
export type OpenApiJsSchemaGenerator = OpenApiGenerator & {
  [JsSchemaGeneratorExtension.getParameterType]: (
    doc: JsDocument,
    ref: OperationReference,
  ) => Promise<t.TSType>;
  [JsSchemaGeneratorExtension.encodeParameters]: (
    doc: JsDocument,
    ref: OperationReference,
    parameters: t.Expression,
  ) => Promise<t.Expression>;
  [JsSchemaGeneratorExtension.getResponseType]: (
    doc: JsDocument,
    ref: OperationReference,
  ) => Promise<t.TSType>;
  [JsSchemaGeneratorExtension.parseResponse]: (
    doc: JsDocument,
    ref: OperationReference,
    response: t.Expression,
  ) => Promise<t.Expression>;
};

const getRequesterType = Symbol("JsRequestGeneratorExtension:getRequesterType");
const getRequestCall = Symbol("JsRequestGeneratorExtension:getRequestCall");
export const JsRequestGeneratorExtension = Object.freeze({
  getRequesterType,
  getRequestCall,
} as const);
export type OpenApiJsRequestGenerator = OpenApiGenerator & {
  [JsSchemaGeneratorExtension.getParameterType]: (
    doc: JsDocument,
    ref: OperationReference,
  ) => Promise<t.TSType>;
  [JsSchemaGeneratorExtension.getResponseType]: (
    doc: JsDocument,
    ref: OperationReference,
  ) => Promise<t.TSType>;
  [JsRequestGeneratorExtension.getRequesterType]: (doc: JsDocument) => Promise<t.TSType>;
  [JsRequestGeneratorExtension.getRequestCall]: (
    doc: JsDocument,
    requester: t.Expression,
    parameters: t.Expression,
    ref: OperationReference,
  ) => Promise<t.Expression>;
};
