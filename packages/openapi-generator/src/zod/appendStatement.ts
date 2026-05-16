import * as t from "@babel/types";
import { dereferenceSchema, type SchemaReferenceType } from "../core.js";

function createAppendStatementInternal(
  appendTo: t.Expression,
  name: string,
  value: t.Expression,
  schemaRef: SchemaReferenceType,
): t.Statement | null {
  const schema = dereferenceSchema(null!, schemaRef);

  if (schema.allOf?.length === 1) {
    return createAppendStatementInternal(appendTo, name, value, schema.allOf[0]!);
  }

  if (!("type" in schema)) return null;
  const append = (value: t.Expression) =>
    t.expressionStatement(
      t.callExpression(t.memberExpression(appendTo, t.identifier("append")), [
        t.stringLiteral(name),
        value,
      ]),
    );

  if (schema.type === "array") {
    const appendStatement = createAppendStatementInternal(
      appendTo,
      name,
      t.identifier("item"),
      schema.items ?? ({} as SchemaReferenceType),
    );
    if (!appendStatement) return null;
    return t.forOfStatement(
      t.variableDeclaration("const", [t.variableDeclarator(t.identifier("item"))]),
      value,
      appendStatement,
    );
  }

  if (schema.type === "string") {
    return append(value);
  }
  if (schema.type === "number" || schema.type === "integer" || schema.type === "boolean") {
    return append(t.callExpression(t.identifier("String"), [value]));
  }
  return null;
}

export function createAppendStatement(
  appendTo: t.Expression,
  name: string,
  value: t.Expression,
  schemaRef: SchemaReferenceType,
  required: boolean,
): t.Statement | null {
  const appendStatement = createAppendStatementInternal(appendTo, name, value, schemaRef);
  if (!appendStatement) return null;
  if (required) return appendStatement;
  return t.ifStatement(
    t.binaryExpression("!==", value, t.identifier("undefined")),
    appendStatement,
  );
}
