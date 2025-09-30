import * as t from "@babel/types";
import { Context } from "effect";

export interface SchemaGenerator {
  modifiers: {
    lazy: (expression: t.Expression) => t.Expression;
    optional: (expression: t.Expression) => t.Expression;
    regex: (expression: t.Expression, pattern: string) => t.Expression;
    immutable: (expression: t.Expression) => t.Expression;
    mutable: (expression: t.Expression) => t.Expression;
    nullable: (expression: t.Expression) => t.Expression;
  };
  types: {
    schema: t.TSQualifiedName;
    typeDecoded: t.TSQualifiedName;
    typeEncoded: t.TSQualifiedName;
  };
  schema: {
    record: (key: t.Expression, value: t.Expression) => t.Expression;
    union: (expressions: t.Expression[]) => t.Expression;
    enum: (expressions: t.Expression[]) => t.Expression;
    instanceOf: t.Expression;
    boolean: t.Expression;
    string: t.Expression;
    number: t.Expression;
    integer: t.Expression;
    array: t.Expression;
    object: t.Expression;
    null: t.Expression;
    unknown: t.Expression;
  };
  transformer: (options: {
    encoded: t.Expression;
    decoded: t.Expression;
    decode: t.Expression | t.BlockStatement;
    encode: t.Expression | t.BlockStatement;
  }) => t.Expression;
  transformerCatch: (expression: t.Expression) => t.BlockStatement;
  builtins: {
    parseJson?: (expression: t.Expression) => t.Expression;
  };
  methods: {
    encode: (schema: t.Expression, value: t.Expression) => t.Expression;
    decode: (schema: t.Expression, value: t.Expression) => t.Expression;
  };
  imports: t.ImportDeclaration[];
  supportsImmutability: boolean;
}
export class SchemaGeneratorContext extends Context.Tag(
  "SchemaGeneratorContext"
)<SchemaGeneratorContext, SchemaGenerator>() {}

const getZodSchemaGenerator = (mini = false) => {
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

  return SchemaGeneratorContext.of({
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
      schema: t.tsQualifiedName(z, t.identifier(mini ? "ZodMiniType" : "Schema")),
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
      integer: t.callExpression(t.memberExpression(z, t.identifier("int")), []),
      array: t.memberExpression(z, t.identifier("array")),
      object: t.memberExpression(z, t.identifier("object")),
      null: t.callExpression(t.memberExpression(z, t.identifier("null")), []),
      unknown: t.callExpression(t.memberExpression(z, t.identifier("unknown")), []),
    },
    transformer: ({ encoded, decoded, decode, encode }) =>
      t.callExpression(t.memberExpression(z, t.identifier("codec")), [
        encoded,
        decoded,
        t.objectExpression([
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
    builtins: {},
    methods: {
      encode: (schema: t.Expression, value: t.Expression) =>
        t.callExpression(
          t.memberExpression(t.identifier("z"), t.identifier("encode")),
          [schema, value]
        ),
      decode: (schema: t.Expression, value: t.Expression) =>
        t.callExpression(
          t.memberExpression(t.identifier("z"), t.identifier("decode")),
          [schema, value]
        ),
    },
    imports: [
      t.importDeclaration(
        [t.importSpecifier(t.identifier("z"), t.identifier("z"))],
        t.stringLiteral(mini ? "zod/mini" : "zod")
      ),
    ],
    supportsImmutability: false,
  });
};

const getEffectSchemaGenerator = () =>
  SchemaGeneratorContext.of({
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
      unknown: t.memberExpression(t.identifier("Schema"), t.identifier("Unknown")),
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
    },
    imports: [
      t.importDeclaration(
        [t.importNamespaceSpecifier(t.identifier("Schema"))],
        t.stringLiteral("effect/Schema")
      ),
    ],
    supportsImmutability: true,
  });

export type SchemaGeneratorFormat = "zod" | "effect" | "zod-mini";

export function getSchemaGenerator(format: SchemaGeneratorFormat) {
  switch (format) {
    case "zod":
      return getZodSchemaGenerator();
    case "effect":
      return getEffectSchemaGenerator();
    case "zod-mini":
      return getZodSchemaGenerator(true);
  }
}
