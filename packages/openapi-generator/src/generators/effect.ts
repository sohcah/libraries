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
      catchall: (object: t.Expression, value: t.Expression) =>
        t.callExpression(
          t.memberExpression(t.identifier("Schema"), t.identifier("extend")),
          [
            object,
            t.callExpression(
              t.memberExpression(t.identifier("Schema"), t.identifier("Record")),
              [
                t.objectExpression([
                  t.objectProperty(
                    t.identifier("key"),
                    t.memberExpression(t.identifier("Schema"), t.identifier("String"))
                  ),
                  t.objectProperty(t.identifier("value"), value),
                ]),
              ]
            ),
          ]
        ),
      union: (expressions) =>
        t.callExpression(
          t.memberExpression(t.identifier("Schema"), t.identifier("Union")),
          expressions
        ),
      intersection: (expressions) =>
        expressions.reduce((a, b) =>
          t.callExpression(
            t.memberExpression(t.identifier("Schema"), t.identifier("extend")),
            [a, b]
          )
        ),
      objectExtend: (expressions) =>
        expressions.reduce((a, b) =>
          t.callExpression(
            t.memberExpression(t.identifier("Schema"), t.identifier("extend")),
            [a, b]
          )
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
    transformer: ({
      encoded,
      decoded,
      decode,
      decodeAsync,
      encode,
      encodeAsync,
    }) => {
      let decodeFn: t.Expression | undefined;
      let encodeFn: t.Expression | undefined;
      if (decodeAsync || encodeAsync) {
        decodeFn = t.arrowFunctionExpression(
          [t.identifier("from"), t.identifier("ctx")],
          t.callExpression(
            t.memberExpression(t.identifier("Effect"), t.identifier("promise")),
            [t.arrowFunctionExpression([], decode, true)]
          )
        );
        encodeFn = t.arrowFunctionExpression(
          [t.identifier("from"), t.identifier("ctx")],
          t.callExpression(
            t.memberExpression(t.identifier("Effect"), t.identifier("promise")),
            [t.arrowFunctionExpression([], encode, true)]
          )
        );
      } else {
        decodeFn = t.arrowFunctionExpression(
          [t.identifier("from"), t.identifier("ctx")],
          decode
        );
        encodeFn = t.arrowFunctionExpression(
          [t.identifier("from"), t.identifier("ctx")],
          encode
        );
      }
      return t.callExpression(
        t.memberExpression(
          t.identifier("Schema"),
          t.identifier(
            decodeAsync || encodeAsync ? "transformOrFail" : "transform"
          )
        ),
        [
          encoded,
          decoded,
          t.objectExpression([
            t.objectProperty(t.identifier("strict"), t.booleanLiteral(true)),
            t.objectProperty(t.identifier("decode"), decodeFn),
            t.objectProperty(t.identifier("encode"), encodeFn),
          ]),
        ]
      );
    },
    transformerCatch: (expression) =>
      t.blockStatement([t.throwStatement(expression)]),
    methods: {
      encode: (schema: t.Expression, value: t.Expression) =>
        t.callExpression(
          t.callExpression(
            t.memberExpression(
              t.identifier("Schema"),
              t.identifier("encodePromise")
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
              t.identifier("decodePromise")
            ),
            [schema]
          ),
          [value]
        ),
      parse: (schema: t.Expression, value: t.Expression) =>
        t.callExpression(
          t.callExpression(
            t.memberExpression(
              t.identifier("Schema"),
              t.identifier("decodeUnknownPromise")
            ),
            [schema]
          ),
          [value]
        ),
    },
    supportsImmutability: true,
  }),
  initialize: Effect.fn(function* () {
    yield* generationHelpers.ensureNamespaceImport("Schema", "effect/Schema");
    yield* generationHelpers.ensureImport("Effect", "effect");
  }),
});
