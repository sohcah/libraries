import { Context } from "effect";
import type { APIDocument } from "./types.js";
import type * as t from "@babel/types";

export interface DocumentContextData {
  document: APIDocument<object>;
  imports: t.ImportDeclaration[];
  schemas: Map<string, t.Statement[]>;
  processingSchemas: Set<string>;
  processingSchemaTypes: Set<string>;
}

export class DocumentContext extends Context.Tag("DocumentContext")<
  DocumentContext,
  DocumentContextData
>() {}
