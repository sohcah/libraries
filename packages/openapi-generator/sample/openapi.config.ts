import { resolve } from "node:path";
import { defineConfig } from "../dist/config.js";

export default defineConfig({
  schema: resolve(import.meta.dirname, "./swagger.json"),
  output: resolve(import.meta.dirname, "./api.ts"),
  onGenerated: () => console.info("Generated."),
});
