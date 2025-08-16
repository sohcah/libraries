import fs from "node:fs/promises";
import { bundle } from "@readme/openapi-parser";
import type { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
import { generate as babelGenerate } from "@babel/generator";
import {
  generate as generateEffect,
  type GeneratorOptions,
} from "./generator.js";
import { Effect, Stream } from "effect";
import { FileSystem, type WatchEvent } from "@effect/platform/FileSystem";

type APIDocument<T extends object> =
  | OpenAPIV2.Document<T>
  | OpenAPIV3_1.Document<T>
  | OpenAPIV3.Document<T>;

export type OpenapiGenerateOptions = GeneratorOptions & {
  schema: APIDocument<object> | string;
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
  const result = yield* Effect.tryPromise(() => bundle(schema));
  if (!("components" in result)) {
    return yield* Effect.die(
      new Error("Not a valid OpenAPI 3.x document")
    );
  }

  const program = yield* generateEffect(result, options);

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
