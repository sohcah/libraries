import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/index.ts", "./src/config.ts", "./src/cli.ts"],
  platform: "node",
})