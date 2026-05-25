#!/usr/bin/env node
import { generate } from "./generate.js";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import watcher from "@parcel/watcher";
import pDebounce from "p-debounce";
import { dirname, resolve } from "node:path";
import type { OpenApiConfigBuilder } from "./config.ts";

const args = parseArgs({
  options: {
    config: {
      type: "string",
    },
    watch: {
      type: "boolean",
      default: false,
    },
  },
});

if (!args.values.config) {
  console.error("No config file provided");
  process.exit(1);
}

const config: OpenApiConfigBuilder<{}> = (
  await import(pathToFileURL(args.values.config).toString())
).default;
if (!config) {
  console.error("Config file does not export a default export");
  process.exit(1);
}

const scheduleGenerate = pDebounce.promise(
  async () => {
    console.info("Generating...");
    await generate(config.build());
    console.info("Generated");
  },
  { after: true },
);

if (args.values.watch) {
  await scheduleGenerate();
  watcher.subscribe(dirname(config.schema), (_, events) => {
    if (events.some((event) => resolve(event.path) === resolve(config.schema)))
      void scheduleGenerate();
  });
} else {
  await scheduleGenerate();
}
