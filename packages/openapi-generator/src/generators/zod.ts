import * as t from "@babel/types";
import {
  createSchemaGenerator,
  type SchemaGeneratorOptions,
} from "./schema.js";
import { Effect } from "effect";
import * as generationHelpers from "./helpers.js";

export interface ZodSchemaGeneratorOptions extends SchemaGeneratorOptions {
  /** @default false */
  mini?: boolean;
}

export const createZodSchemaGenerator = ({
  mini = false,
  ...options
}: ZodSchemaGeneratorOptions) => {
  const z = t.identifier("z");

  const maybeExtension = (
    expression: t.Expression,
    extension: string,
    args: t.Expression[]
  ) =>
    mini
      ? t.callExpression(t.memberExpression(z, t.identifier(extension)), [
          expression,
          ...args,
        ])
      : t.callExpression(
          t.memberExpression(expression, t.identifier(extension)),
          args
        );

  return {
    ...createSchemaGenerator({
      ...options,
      modifiers: {
        lazy: (expression) =>
          t.callExpression(t.memberExpression(z, t.identifier("lazy")), [
            expression,
          ]),
        optional: (expression) => maybeExtension(expression, "optional", []),
        regex: (expression, pattern: string) =>
          maybeExtension(expression, "regex", [t.regExpLiteral(pattern)]),
        immutable: (expression) => expression,
        mutable: (expression) => expression,
        nullable: (expression) => maybeExtension(expression, "nullable", []),
      },
      types: {
        schema: t.tsQualifiedName(
          z,
          t.identifier(mini ? "ZodMiniType" : "Schema")
        ),
        typeDecoded: t.tsQualifiedName(z, t.identifier("output")),
        typeEncoded: t.tsQualifiedName(z, t.identifier("input")),
      },
      schema: {
        record: (key: t.Expression, value: t.Expression) =>
          t.callExpression(t.memberExpression(z, t.identifier("record")), [
            key,
            value,
          ]),
        union: (expressions) =>
          t.callExpression(t.memberExpression(z, t.identifier("union")), [
            t.arrayExpression(expressions),
          ]),
        enum: (expressions) =>
          t.callExpression(t.memberExpression(z, t.identifier("enum")), [
            t.arrayExpression(expressions),
          ]),
        instanceOf: t.memberExpression(z, t.identifier("instanceof")),
        boolean: t.callExpression(
          t.memberExpression(z, t.identifier("boolean")),
          []
        ),
        string: t.callExpression(
          t.memberExpression(z, t.identifier("string")),
          []
        ),
        number: t.callExpression(
          t.memberExpression(z, t.identifier("number")),
          []
        ),
        integer: t.callExpression(
          t.memberExpression(z, t.identifier("int")),
          []
        ),
        array: t.memberExpression(z, t.identifier("array")),
        object: t.memberExpression(z, t.identifier("object")),
        null: t.callExpression(t.memberExpression(z, t.identifier("null")), []),
        unknown: t.callExpression(
          t.memberExpression(z, t.identifier("unknown")),
          []
        ),
      },
      transformer: ({ encoded, decoded, decode, decodeAsync, encode, encodeAsync }) =>
        t.callExpression(t.memberExpression(z, t.identifier("codec")), [
          encoded,
          decoded,
          t.objectExpression([
            t.objectProperty(
              t.identifier("decode"),
              t.arrowFunctionExpression(
                [t.identifier("from"), t.identifier("ctx")],
                decode,
                decodeAsync
              )
            ),
            t.objectProperty(
              t.identifier("encode"),
              t.arrowFunctionExpression(
                [t.identifier("from"), t.identifier("ctx")],
                encode,
                encodeAsync
              )
            ),
          ]),
        ]),
      transformerCatch: (expression) =>
        t.blockStatement([
          t.expressionStatement(
            t.callExpression(
              t.memberExpression(
                t.memberExpression(t.identifier("ctx"), t.identifier("issues")),
                t.identifier("push")
              ),
              [
                t.objectExpression([
                  t.objectProperty(
                    t.identifier("code"),
                    t.stringLiteral("custom")
                  ),
                  t.objectProperty(t.identifier("input"), t.identifier("from")),
                  t.objectProperty(
                    t.identifier("message"),
                    t.memberExpression(
                      t.tsAsExpression(
                        expression,
                        t.tsTypeReference(t.identifier("Error"))
                      ),
                      t.identifier("message")
                    )
                  ),
                ]),
              ]
            )
          ),
          t.returnStatement(
            t.memberExpression(t.identifier("z"), t.identifier("NEVER"))
          ),
        ]),
      methods: {
        encode: (schema: t.Expression, value: t.Expression) =>
          t.callExpression(
            t.memberExpression(t.identifier("z"), t.identifier("encodeAsync")),
            [schema, value]
          ),
        decode: (schema: t.Expression, value: t.Expression) =>
          t.callExpression(
            t.memberExpression(t.identifier("z"), t.identifier("decodeAsync")),
            [schema, value]
          ),
        parse: (schema: t.Expression, value: t.Expression) =>
          t.callExpression(
            t.memberExpression(t.identifier("z"), t.identifier("parseAsync")),
            [schema, value]
          ),
      },
      supportsImmutability: false,
    }),
    initialize: Effect.fn(function* () {
      yield* generationHelpers.ensureImport("z", mini ? "zod/mini" : "zod");
    }),
  };
};
