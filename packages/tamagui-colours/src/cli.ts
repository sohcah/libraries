#!/usr/bin/env node

import { Command, Options } from "@effect/cli";
import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { Console, Effect, Option } from "effect";
import { generateRadixColors } from "./generateRadixColours.js";

// Define the top-level command
const command = Command.make("@sohcah/tamagui-colours", {}).pipe(
  Command.withSubcommands([
    Command.make(
      "generate",
      {
        name: Options.text("name").pipe(Options.withDescription("The palette's name")).pipe(Options.withAlias("n")).pipe(Options.withDefault("myPalette")),
        appearance: Options.choice("appearance", ["light", "dark"]).pipe(Options.withDescription("The palette's appearance")).pipe(Options.withAlias("a")),
        primary: Options.text("primary").pipe(Options.withDescription("The palette's primary colour")).pipe(Options.withAlias("p")),
        background: Options.text("background").pipe(Options.withDescription("The palette's background colour")).pipe(Options.withAlias("b")).pipe(Options.optional),
      },
      Effect.fn(function* (args) {
        const palette = generateRadixColors({
            appearance: args.appearance,
            accent: args.primary,
            gray: "#ff5500", // We don't use
            background: Option.getOrElse(args.background, () => args.appearance === "light" ? "#ffffff" : "#111111"),
        });

        const paletteCode = `const ${args.name}${args.appearance === "light" ? "" : "Dark"} = {
${palette.accentScale.map((color, index) => `  ${args.name}${index + 1}: ${JSON.stringify(color)},`).join("\n")}
};`;

        yield* Console.info("Generated palette code:");
        yield* Console.info(paletteCode);
      })
    ),
  ])
);

// Set up the CLI application
const cli = Command.run(command, {
  name: "@sohcah/tamagui-colours",
  version: "v0.0.1",
});

// Prepare and run the CLI application
cli(process.argv).pipe(Effect.provide(NodeContext.layer), NodeRuntime.runMain);
