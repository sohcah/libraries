#!/usr/bin/env node

import { Command, Options } from "@effect/cli";
import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { Effect } from "effect";
import { generateToFile } from "./index.js";

// Define the top-level command
const command = Command.make("@sohcah/openapi-generator", {}).pipe(
  Command.withSubcommands([
    Command.make(
      "generate",
      {
        watch: Options.boolean("watch")
          .pipe(Options.withDefault(false))
          .pipe(Options.withAlias("w")),
        config: Options.text("config")
          .pipe(Options.withAlias("c"))
          .pipe(Options.withDefault("openapi.config.ts")),
      },
      Effect.fn(function* (args) {
        const config = yield* Effect.tryPromise(
          () => import(`file://${process.cwd()}/${args.config}`)
        ).pipe(
          Effect.mapError(
            (e) => new Error(`Failed to load config: ${e.message}`)
          )
        );
        yield* generateToFile({
          ...config.default,
          watch: args.watch,
        });
      })
    ),
  ])
);

// Set up the CLI application
const cli = Command.run(command, {
  name: "@sohcah/openapi-generator",
  version: "v0.0.1",
});

// Prepare and run the CLI application
cli(process.argv).pipe(Effect.provide(NodeContext.layer), NodeRuntime.runMain);
