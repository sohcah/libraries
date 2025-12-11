import { Effect } from "effect";
import type { SchemaObject } from "../../types.js";
import type { DefaultSchemaGeneratorOptions } from "../schema.js";
import * as t from "@babel/types";
import { notImplementedStatement } from "../helpers.js";

export const generateJsonRequestCodec = Effect.fn(function* (
  options: DefaultSchemaGeneratorOptions,
  schema: SchemaObject,
  decoded: t.Expression
) {
  return options.transformer({
    encoded: options.schema.string,
    decoded,
    decode: notImplementedStatement,
    encode: t.callExpression(
      t.memberExpression(t.identifier("JSON"), t.identifier("stringify")),
      [t.identifier("from")]
    ),
  });
});
