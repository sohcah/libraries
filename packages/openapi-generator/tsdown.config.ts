import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "./src/index.ts",
    "./src/config.ts",
    // "./src/cli.ts",
    "./src/react-query/index.ts",
    "./src/react-query/std-runtime.ts",
    "./src/zod/index.ts",
    "./src/generate.ts",
  ],
  platform: "node",
});
