import { test, expect } from "vitest";
import { resolve } from "node:path";

import { generate } from "../src/index.js";
import { Effect } from "effect";
import { createReactQueryClientGenerator } from "../src/generators/client.js";
import { createEffectSchemaGenerator } from "../src/generators/effect.js";
import { createZodSchemaGenerator } from "../src/generators/zod.js";

test("Should generate correct output - effect", async () => {
  const result = await Effect.runPromise(
    generate({
      schema: resolve(import.meta.dirname, "../sample/swagger.json"),
      generators: [
        createReactQueryClientGenerator({
          schema: createEffectSchemaGenerator({}),
        }),
      ],
    })
  );

  expect(result).toMatchSnapshot();
});

test("Should generate correct output - zod", async () => {
  const result = await Effect.runPromise(
    generate({
      schema: resolve(import.meta.dirname, "../sample/swagger.json"),
      generators: [
        createReactQueryClientGenerator({
          schema: createZodSchemaGenerator({}),
        }),
      ],
    })
  );

  expect(result).toMatchSnapshot();
});
