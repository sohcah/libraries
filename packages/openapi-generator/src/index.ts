import fs from "node:fs/promises";
import { bundle } from "@readme/openapi-parser";
import type { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
import { generate as babelGenerate } from "@babel/generator";
import { Generator, type GeneratorOptions } from "./generator.js";

type APIDocument<T extends object> =
  | OpenAPIV2.Document<T>
  | OpenAPIV3_1.Document<T>
  | OpenAPIV3.Document<T>;

export type OpenapiGenerateOptions = GeneratorOptions & {
  schema: APIDocument<object> | string;
}

export type OpenapiGenerateToFileOptions = OpenapiGenerateOptions & {
  output: string;
  watch?: boolean;
  onGenerated?: () => void;
}

export async function generate({ schema, ...options }: OpenapiGenerateOptions) {
  const result = await bundle(schema);
  if (!("components" in result)) {
    throw new Error("Not a valid OpenAPI 3.x document");
  }

  const program = new Generator(result, options).build();

  return babelGenerate(program).code;
}

export async function generateToFile({ onGenerated, output, watch, ...options }: OpenapiGenerateToFileOptions) {
  let lastCode = await generate(options);
  await fs.writeFile(output, lastCode);
  onGenerated?.();

  if (watch) {
    if (typeof options.schema !== "string") {
      throw new Error("Schema must a file path to use watch mode");
    }
    for await (const event of fs.watch(options.schema)) {
      if (event.eventType === "change") {
        const outputCode = await generate(options);
        if (outputCode !== lastCode) {
          await fs.writeFile(output, outputCode);
          onGenerated?.();
          lastCode = outputCode;
        }
      }
    }
  }
}