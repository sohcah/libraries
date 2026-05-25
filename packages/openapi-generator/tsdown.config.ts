import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "./src/config.ts",
    "./src/cli.ts",
    "./src/react-query/index.ts",
    "./src/react-query/std-runtime.ts",
    "./src/fetch/index.ts",
    "./src/zod/index.ts",
    "./src/generate.ts",
  ],
  platform: "node",
  sourcemap: true,
  dts: true,
});
