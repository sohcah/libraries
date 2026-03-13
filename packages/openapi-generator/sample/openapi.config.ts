import { resolve } from "node:path";
import { defineConfig } from "../dist/config.mjs";
import {
  createReactQueryClientGenerator,
  createZodSchemaGenerator,
  createEffectSchemaGenerator,
} from "../dist/generators/index.mjs";

const format = (process.env.SCHEMA_FORMAT ?? "zod") as
  | "zod"
  | "effect"
  | "zod-mini";

export default defineConfig({
  schema: resolve(import.meta.dirname, "./swagger.json"),
  output: resolve(import.meta.dirname, `./api.${format}.ts`),
  generators: [
    createReactQueryClientGenerator({
      schema: {
        zod: createZodSchemaGenerator({ experimental_includeTypes: true }),
        "zod-mini": createZodSchemaGenerator({ mini: true }),
        effect: createEffectSchemaGenerator({}),
      }[format],
    }),
  ],
  onGenerated: () => console.info("Generated."),
});
