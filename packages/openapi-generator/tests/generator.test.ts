import { test, expect } from "vitest";
import { resolve } from "node:path";

import { generate } from "../src/index.js";
import { Effect } from "effect";

test("Should generate correct output - effect", async () => {
  const result = await Effect.runPromise(
    generate({
      schema: resolve(import.meta.dirname, "../sample/swagger.json"),
      schemas: {
        format: "effect",
      },
    })
  );

  expect(result).toMatchSnapshot();
});

test("Should generate correct output - zod", async () => {
  const result = await Effect.runPromise(
    generate({
      schema: resolve(import.meta.dirname, "../sample/swagger.json"),
      schemas: {
        format: "zod",
      },
    })
  );

  expect(result).toMatchSnapshot();
});
