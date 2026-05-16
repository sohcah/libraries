import { defineConfig } from "./config.js";
import { generate } from "./generate.js";
import { createReactQueryGenerator } from "./react-query/index.js";
import { createZodGenerator, type ZodSchemaOverride } from "./zod/index.js";

const config = defineConfig({
  schema: "swagger.json",
})
  .addBuilder(
    "zod",
    createZodGenerator({
      output: "output/api.schemas.ts",
    }),
  )
  .addBuilder(
    "reactQuery",
    createReactQueryGenerator({
      output: "output/api.queries.ts",
      schemaGenerator: "zod",
      importExtensions: "remove",
    }),
  );

await generate(config);
