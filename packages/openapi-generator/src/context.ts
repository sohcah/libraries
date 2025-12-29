import { Context } from "effect";
import type { APIDocument } from "./types.js";
import type * as t from "@babel/types";
import type { ExpressionWithType } from "./generators/schema.js";

export interface DocumentContextData {
  document: APIDocument<object>;
  imports: t.ImportDeclaration[];
  schemas: Map<string, t.Statement[]>;
  schemaTypeMeta: Map<string, ExpressionWithType["typeMeta"]>;
  processingSchemas: Set<string>;
  processingSchemaTypes: Set<string>;
}

export class DocumentContext extends Context.Tag("DocumentContext")<
  DocumentContext,
  DocumentContextData
>() {}
