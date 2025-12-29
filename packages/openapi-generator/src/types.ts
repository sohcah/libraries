import type { OpenAPIV3_2 as OA } from "@scalar/openapi-types";

export type APIDocument<T extends object> = OA.Document<T>;

export type ReferenceObject = OA.ReferenceObject;

export type SchemaObject = OA.SchemaObject;

export type OperationObject = OA.OperationObject;

export type ResponseObject = OA.ResponseObject;

export type MediaTypeObject = OA.MediaTypeObject;
