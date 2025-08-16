import { test, expect } from "vitest";
import { resolve } from "node:path";

import { generate } from "../src/index.js";

test("Should generate correct output", async () => {
  const result = await generate({
    schema: resolve(import.meta.dirname, "../sample/swagger.json"),
  });

  expect(result).toMatchSnapshot();
});
