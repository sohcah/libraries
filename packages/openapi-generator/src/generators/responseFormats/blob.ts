import { Effect } from "effect";
import type { DefaultSchemaGeneratorOptions } from "../schema.js";
import * as t from "@babel/types";
import { notImplementedStatement } from "../helpers.js";

export const generateBlobResponseCodec = Effect.fn(function* (
  options: DefaultSchemaGeneratorOptions
) {
  return options.transformer({
    encoded: t.callExpression(options.schema.instanceOf, [
      t.identifier("Response"),
    ]),
    decoded: t.callExpression(options.schema.instanceOf, [
      t.identifier("Blob"),
    ]),
    decode: t.blockStatement([
      t.tryStatement(
        t.blockStatement([
          t.returnStatement(
            t.tsAsExpression(
              t.awaitExpression(
                t.callExpression(
                  t.memberExpression(
                    t.identifier("from"),
                    t.identifier("blob")
                  ),
                  []
                )
              ),
              t.tsAnyKeyword()
            )
          ),
        ]),
        t.catchClause(
          Object.assign(t.identifier("error"), {
            typeAnnotation: t.tsTypeAnnotation(t.tsUnknownKeyword()),
          }),
          options.transformerCatch(t.identifier("error"))
        )
      ),
    ]),
    decodeAsync: true,
    encode: notImplementedStatement,
  });
});
