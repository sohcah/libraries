import { Effect } from "effect";
import type { DocumentContext } from "../context.js";
import type * as t from "@babel/types";
import type { OperationObject, SchemaObject } from "../types.js";
import type { NotImplementedError } from "../errors.js";
import type * as generationHelpers from "./helpers.js";

export interface ImportReference {
  type: "import";
  name: string;
  from: string;
}

export interface OpenApiGenerator {
  initialize?: () => Effect.Effect<void, NotImplementedError, DocumentContext>;
  processSchema?: (
    schema: SchemaObject
  ) => Effect.Effect<void, NotImplementedError, DocumentContext>;
  processOperation?: (
    operationKey: generationHelpers.OperationKey,
    path: string,
    method: generationHelpers.HttpMethod,
    operation: OperationObject
  ) => Effect.Effect<void, NotImplementedError, DocumentContext>;
}

export interface OpenApiParametersSchema {
  expression: t.Expression;
  typeReference: t.TSTypeReference;
}

export interface OpenApiResponseSchema {
  expression: t.Expression;
  typeReference: t.TSTypeReference;
}

export interface OpenApiSchemaGenerator extends OpenApiGenerator {
  decodeResponse: (schema: t.Expression, response: t.Expression) => Effect.Effect<t.Expression>;
  encodeParameters: (schema: t.Expression, parameters: t.Expression) => Effect.Effect<t.Expression>;
  ensureParametersSchema: (
    operationKey: generationHelpers.OperationKey,
    operation: OperationObject,
    path: string
  ) => Effect.Effect<
    OpenApiParametersSchema,
    NotImplementedError,
    DocumentContext
  >;
  ensureResponseSchema: (
    operationKey: generationHelpers.OperationKey,
    operation: OperationObject
  ) => Effect.Effect<
    OpenApiResponseSchema,
    NotImplementedError,
    DocumentContext
  >;
  get schemaType(): t.TSEntityName;
}

export interface OpenApiClientGenerator extends OpenApiGenerator {}
