import * as t from "@babel/types";
import {
  createSchemaGenerator,
  type SchemaGeneratorOptions,
} from "./schema.js";
import { Effect } from "effect";
import * as generationHelpers from "./helpers.js";

export const createEffectSchemaGenerator = (
  options: SchemaGeneratorOptions
) => ({
  ...createSchemaGenerator({
    ...options,
    modifiers: {
      lazy: (expression) =>
        t.callExpression(
          t.memberExpression(t.identifier("Schema"), t.identifier("suspend")),
          [expression]
        ),
      optional: (expression) =>
        t.callExpression(t.memberExpression(expression, t.identifier("pipe")), [
          t.memberExpression(t.identifier("Schema"), t.identifier("optional")),
        ]),
      regex: (expression, pattern: string) =>
        t.callExpression(t.memberExpression(expression, t.identifier("pipe")), [
          t.callExpression(
            t.memberExpression(t.identifier("Schema"), t.identifier("pattern")),
            [t.regExpLiteral(pattern)]
          ),
        ]),
      immutable: (expression) => expression,
      mutable: (expression) =>
        t.callExpression(t.memberExpression(expression, t.identifier("pipe")), [
          t.memberExpression(t.identifier("Schema"), t.identifier("mutable")),
        ]),
      nullable: (expression) =>
        t.callExpression(t.memberExpression(expression, t.identifier("pipe")), [
          t.memberExpression(t.identifier("Schema"), t.identifier("NullOr")),
        ]),
    },
    types: {
      schema: t.tsQualifiedName(t.identifier("Schema"), t.identifier("Schema")),
      typeDecoded: t.tsQualifiedName(
        t.tsQualifiedName(t.identifier("Schema"), t.identifier("Schema")),
        t.identifier("Type")
      ),
      typeEncoded: t.tsQualifiedName(
        t.tsQualifiedName(t.identifier("Schema"), t.identifier("Schema")),
        t.identifier("Encoded")
      ),
    },
    schema: {
      record: (key: t.Expression, value: t.Expression) =>
        t.callExpression(
          t.memberExpression(t.identifier("Schema"), t.identifier("Record")),
          [
            t.objectExpression([
              t.objectProperty(t.identifier("key"), key),
              t.objectProperty(t.identifier("value"), value),
            ]),
          ]
        ),
      union: (expressions) =>
        t.callExpression(
          t.memberExpression(t.identifier("Schema"), t.identifier("Union")),
          expressions
        ),
      enum: (expressions) =>
        t.callExpression(
          t.memberExpression(t.identifier("Schema"), t.identifier("Literal")),
          expressions
        ),
      instanceOf: t.memberExpression(
        t.identifier("Schema"),
        t.identifier("instanceOf")
      ),
      boolean: t.memberExpression(
        t.identifier("Schema"),
        t.identifier("Boolean")
      ),
      string: t.memberExpression(
        t.identifier("Schema"),
        t.identifier("String")
      ),
      number: t.memberExpression(
        t.identifier("Schema"),
        t.identifier("Number")
      ),
      integer: t.callExpression(
        t.memberExpression(
          t.memberExpression(t.identifier("Schema"), t.identifier("Number")),
          t.identifier("pipe")
        ),
        [
          t.callExpression(
            t.memberExpression(t.identifier("Schema"), t.identifier("int")),
            []
          ),
        ]
      ),
      array: t.memberExpression(t.identifier("Schema"), t.identifier("Array")),
      object: t.memberExpression(
        t.identifier("Schema"),
        t.identifier("Struct")
      ),
      null: t.memberExpression(t.identifier("Schema"), t.identifier("Null")),
      unknown: t.memberExpression(
        t.identifier("Schema"),
        t.identifier("Unknown")
      ),
    },
    transformer: ({ encoded, decoded, decode, encode }) =>
      t.callExpression(
        t.memberExpression(t.identifier("Schema"), t.identifier("transform")),
        [
          encoded,
          decoded,
          t.objectExpression([
            t.objectProperty(t.identifier("strict"), t.booleanLiteral(true)),
            t.objectProperty(
              t.identifier("decode"),
              t.arrowFunctionExpression(
                [t.identifier("from"), t.identifier("ctx")],
                decode
              )
            ),
            t.objectProperty(
              t.identifier("encode"),
              t.arrowFunctionExpression(
                [t.identifier("from"), t.identifier("ctx")],
                encode
              )
            ),
          ]),
        ]
      ),
    transformerCatch: (expression) =>
      t.blockStatement([t.throwStatement(expression)]),
    builtins: {
      parseJson: (expression) =>
        t.callExpression(
          t.memberExpression(t.identifier("Schema"), t.identifier("parseJson")),
          [expression]
        ),
    },
    methods: {
      encode: (schema: t.Expression, value: t.Expression) =>
        t.callExpression(
          t.callExpression(
            t.memberExpression(
              t.identifier("Schema"),
              t.identifier("encodeSync")
            ),
            [schema]
          ),
          [value]
        ),
      decode: (schema: t.Expression, value: t.Expression) =>
        t.callExpression(
          t.callExpression(
            t.memberExpression(
              t.identifier("Schema"),
              t.identifier("decodeSync")
            ),
            [schema]
          ),
          [value]
        ),
      parse: (schema: t.Expression, value: t.Expression) =>
        t.callExpression(
          t.callExpression(
            t.memberExpression(t.identifier("Schema"), t.identifier("decodeUnknownSync")),
            [schema]
          ),
          [value]
        ),
    },
    supportsImmutability: true,
  }),
  initialize: Effect.fn(function* () {
    yield* generationHelpers.ensureNamespaceImport("Schema", "effect/Schema");
  }),
});
