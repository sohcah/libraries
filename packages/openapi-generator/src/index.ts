import { bundle } from "@scalar/json-magic/bundle";
import { readFiles, fetchUrls } from "@scalar/json-magic/bundle/plugins/node";
import { generate as babelGenerate } from "@babel/generator";
import {
  generate as generateEffect,
  type GeneratorOptions,
} from "./generator.js";
import { Effect, Stream } from "effect";
import { FileSystem, type WatchEvent } from "@effect/platform/FileSystem";
import { upgrade } from "@scalar/openapi-upgrader";
import { FailedToUpgradeOpenApiDocumentError } from "./errors.js";

export type OpenapiGenerateOptions = GeneratorOptions & {
  schema: string;
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

export const generateToFile = Effect.fn(function* ({
  onGenerated,
  output,
  watch,
  ...options
}: OpenapiGenerateToFileOptions) {
  const fs = yield* FileSystem;
  let lastCode = yield* generate(options);
  yield* fs.writeFileString(output, lastCode);
  onGenerated?.();

  if (watch) {
    if (typeof options.schema !== "string") {
      throw new Error("Schema must a file path to use watch mode");
    }
    yield* Stream.runForEach(
      fs.watch(options.schema),
      Effect.fn(function* (event: WatchEvent) {
        if (event._tag === "Update") {
          const outputCode = yield* generate(options);
          if (outputCode !== lastCode) {
            yield* fs.writeFileString(output, outputCode);
            onGenerated?.();
            lastCode = outputCode;
          }
        }
      })
    );
  }
});
