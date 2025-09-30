import { resolve } from "node:path";
import { defineConfig } from "../dist/config.js";

const format = (process.env.SCHEMA_FORMAT ?? "zod") as "zod" | "effect" | "zod-mini";

export default defineConfig({
  schema: resolve(import.meta.dirname, "./swagger.json"),
  output: resolve(import.meta.dirname, `./api.${format}.ts`),
  schemas: {
    format,
  },
  onGenerated: () => console.info("Generated."),
});
