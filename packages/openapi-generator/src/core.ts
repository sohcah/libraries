import * as OA from "@scalar/workspace-store/schemas/v3.1/strict/openapi-document";

export type ApiDocument = OA.OpenApiDocument;

export type SchemaObject = OA.SchemaObject;

export type SchemaReferenceType = OA.SchemaReferenceType<OA.SchemaObject>;

export type ParameterObject = OA.ParameterObject;

export type OperationObject = OA.OperationObject;

export type ResponseObject = OA.ResponseObject;

export type MediaTypeObject = OA.MediaTypeObject;

export type OperationReference = {
  pathKey: string;
  methodKey: string;
  operation: OperationObject;
};

export function dereferenceSchema(document: ApiDocument, schema: SchemaReferenceType): SchemaObject {
  if ("$ref-value" in schema) {
    return schema["$ref-value"] as SchemaObject;
  }
  return schema;
}

export function dereference<T extends object>(ref: OA.ReferenceType<T>): T {
  if ("$ref-value" in ref) {
    return ref["$ref-value"];
  }
  return ref;
}

export interface OpenApiGenerator {
  visitOperation?: (
    document: ApiDocument,
    ref: OperationReference,
  ) => Promise<void>;
  visitSchema?: (
    document: ApiDocument,
    ref: SchemaReferenceType,
  ) => Promise<void>;

  complete: () => Promise<void>;
}
