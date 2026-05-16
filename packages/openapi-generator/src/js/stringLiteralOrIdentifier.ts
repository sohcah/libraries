import * as t from "@babel/types";

export function stringLiteralOrIdentifier(value: string) {
  if (value.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
    return t.identifier(value);
  }
  return t.stringLiteral(value);
}

export function stringMemberExpression(object: t.Expression, property: string) {
  if (property.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
    return t.memberExpression(object, t.identifier(property));
  }
  return t.memberExpression(object, t.stringLiteral(property), true);
}
