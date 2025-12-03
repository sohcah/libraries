import * as t from "@babel/types";
import escapeRegex from "regex-escape";

export function generatePathExpression(
  path: string,
  pathParameters: Record<string, t.Expression>,
  queryParameter: t.Expression | null
): t.TemplateLiteral {
  let modifiedPath = path;
  if (queryParameter) {
    modifiedPath += "?";
  }

  const split = modifiedPath.split(
    new RegExp(
      `\\{(${Object.keys(pathParameters)
        .map((i) => escapeRegex(i))
        .join("|")})\\}`,
      "g"
    )
  );

  const quasis: t.TemplateElement[] = [];
  const expressions: t.Expression[] = [];

  for (const [i, part] of split.entries()) {
    if (i % 2 === 0) {
      quasis.push(t.templateElement({ raw: part, cooked: part }, false));
    } else {
      const paramExpression = pathParameters[part];
      if (!paramExpression) {
        throw new Error(`Path parameter ${part} not found`);
      }
      expressions.push(paramExpression);
    }
  }

  if (queryParameter) {
    expressions.push(queryParameter);
    quasis.push(t.templateElement({ raw: "", cooked: "" }, false));
  }

  return t.templateLiteral(quasis, expressions);
}
