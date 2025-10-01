import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/index.ts", "./src/config.ts", "./src/cli.ts", "./src/generators/index.ts"],
  platform: "node",
})