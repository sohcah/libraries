import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";

export type APIDocument<T extends object> =
  | OpenAPIV3_1.Document<T>
  | OpenAPIV3.Document<T>;

export type ReferenceObject = OpenAPIV3.ReferenceObject | OpenAPIV3_1.ReferenceObject;

export type SchemaObject = OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject;

export type OperationObject = OpenAPIV3_1.OperationObject | OpenAPIV3.OperationObject;