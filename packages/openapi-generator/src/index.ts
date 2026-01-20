import { bundle } from "@scalar/json-magic/bundle";
import { readFiles, fetchUrls } from "@scalar/json-magic/bundle/plugins/node";
import { generate as babelGenerate } from "@babel/generator";
import {
  generate as generateEffect,
  type GeneratorOptions,
} from "./generator.js";
import { Console, Effect, Stream } from "effect";
import { FileSystem, type WatchEvent } from "@effect/platform/FileSystem";
import { upgrade } from "@scalar/openapi-upgrader";
import { FailedToUpgradeOpenApiDocumentError } from "./errors.js";

export type OpenapiGenerateOptions = GeneratorOptions & {
  schema: string | Record<string, unknown>;
};

export type OpenapiGenerateToFileOptions = OpenapiGenerateOptions & {
  output: string;
  watch?: boolean;
  onGenerated?: () => void;
};

export const generate = Effect.fn(function* ({
  schema,
  ...options
}: OpenapiGenerateOptions) {
  const bundled = yield* Effect.tryPromise(() =>
    bundle(schema, {
      plugins: [readFiles(), fetchUrls({ limit: 5 })],
      treeShake: false,
    })
  );
  const upgraded = yield* Effect.try({
    try: () => upgrade(bundled, "3.2"),
    catch: (e) => new FailedToUpgradeOpenApiDocumentError({ cause: e }),
  });

  const program = yield* generateEffect(upgraded, options);

  return babelGenerate(program).code;
});

const time = () => new Date().toLocaleTimeString("en-GB");

export const generateToFile = Effect.fn(function* ({
  onGenerated,
  output,
  watch,
  ...options
}: OpenapiGenerateToFileOptions) {
  let lastCode: string | null = null;

  const fs = yield* FileSystem;

  const generateCode = () =>
    Effect.catchAll(
      Effect.gen(function* () {
        if (watch) yield* Console.info(`[${time()}] Generating code...`);
        const outputCode = yield* generate(options);
        if (outputCode !== lastCode) {
          yield* fs.writeFileString(output, outputCode);
          onGenerated?.();
          lastCode = outputCode;
          if (watch) {
            yield* Console.info(`[${time()}] Generated code successfully`);
          }
        } else if (watch) {
          yield* Console.info(`[${time()}] Code is already up to date`);
        }
      }),
      Effect.fn(function* (error) {
        if (watch) {
          yield* Console.error(`[${time()}] Failed to generate code`, error);
        } else {
          yield* Effect.fail(error);
        }
      })
    );

  yield* generateCode();

  if (watch) {
    if (typeof options.schema !== "string") {
      return yield* Effect.die(
        new Error("Schema must be a file path to use watch mode")
      );
    }
    yield* Stream.runForEach(
      fs.watch(options.schema),
      Effect.fn(function* (event: WatchEvent) {
        if (event._tag === "Update") {
          yield* generateCode();
        }
      })
    );
  }
});
