import type { ReferenceObject, SchemaObject } from "../../types.js";
import {
  resolveSchema,
  type DefaultSchemaGeneratorOptions,
} from "../schema.js";
import * as t from "@babel/types";
import { Effect } from "effect";
import { notImplementedStatement } from "../helpers.js";

const maybeStringify = Effect.fn(function* (
  expression: t.Expression,
  schema: SchemaObject | ReferenceObject
) {
  const resolved = yield* resolveSchema(schema);
  if (resolved.type === "object" || resolved.type === "array") {
    return t.callExpression(
      t.memberExpression(t.identifier("JSON"), t.identifier("stringify")),
      [expression]
    );
  }
  if (resolved.type === "string") {
    return expression;
  }
  return t.callExpression(t.identifier("String"), [expression]);
});

export const generateFormDataRequestCodec = Effect.fn(function* (
  options: DefaultSchemaGeneratorOptions,
  schema: SchemaObject,
  decoded: t.Expression
) {
  const encode = t.blockStatement([
    t.variableDeclaration("const", [
      t.variableDeclarator(
        t.identifier("formData"),
        t.newExpression(t.identifier("FormData"), [])
      ),
    ]),
  ]);
  const properties: Record<string, SchemaObject | ReferenceObject> =
    schema.properties ?? {};
  for (const [propertyKey, rawProperty] of Object.entries(properties)) {
    const property = yield* resolveSchema(rawProperty);

    const propertyExpression = t.memberExpression(
      t.identifier("from"),
      t.stringLiteral(propertyKey),
      true
    );

    if (property.type === "array") {
      encode.body.push(
        t.forOfStatement(
          t.variableDeclaration("const", [
            t.variableDeclarator(t.identifier("propertyValue")),
          ]),
          propertyExpression,
          t.blockStatement([
            t.expressionStatement(
              t.callExpression(
                t.memberExpression(
                  t.identifier("formData"),
                  t.identifier("append")
                ),
                [
                  t.stringLiteral(propertyKey),
                  yield* maybeStringify(
                    t.identifier("propertyValue"),
                    property.items
                  ),
                ]
              )
            ),
          ])
        )
      );
      continue;
    }

    encode.body.push(
      t.expressionStatement(
        t.callExpression(
          t.memberExpression(t.identifier("formData"), t.identifier("append")),
          [
            t.stringLiteral(propertyKey),
            yield* maybeStringify(propertyExpression, property),
          ]
        )
      )
    );
  }

  encode.body.push(t.returnStatement(t.identifier("formData")));

  return options.transformer({
    encoded: t.callExpression(options.schema.instanceOf, [
      t.identifier("FormData"),
    ]),
    decoded,
    decode: notImplementedStatement,
    encode,
  });
});
