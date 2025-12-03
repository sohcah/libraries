import { expect, test } from "vitest";
import { generatePathExpression } from "../src/generators/generatePathExpression.js";
import { generate } from "@babel/generator";
import * as t from "@babel/types";

test.for([
  ["/depts/{year}/{week}", {}, null, "`/depts/{year}/{week}`"],
  [
    "/depts/{year}/{week}",
    { year: t.stringLiteral("year") },
    null,
    '`/depts/${"year"}/{week}`',
  ],
  [
    "/depts/y{year}/{week}",
    {
      year: t.memberExpression(t.identifier("from"), t.identifier("year")),
      week: t.memberExpression(t.identifier("from"), t.identifier("week")),
    },
    t.newExpression(t.identifier("URLSearchParams"), [
      t.stringLiteral("search=text"),
    ]),
    '`/depts/y${from.year}/${from.week}?${new URLSearchParams("search=text")}`',
  ],
] as const)(
  "generatePathExpression",
  ([path, pathParameters, queryParameter, expected]) => {
    const result = generatePathExpression(path, pathParameters, queryParameter);
    expect(generate(result).code).toBe(expected);
  }
);
