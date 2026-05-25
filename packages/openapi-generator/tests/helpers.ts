import { mkdtemp, rm, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect } from "vitest";
import { stringify as stringifyYaml } from "yaml";
import { defineConfig } from "../src/config.ts";
import { generate } from "../src/generate.ts";
import { createZodGenerator, type ZodGeneratorOptions } from "../src/zod/index.ts";
import { createFetchGenerator } from "../src/fetch/index.ts";
import { createReactQueryGenerator } from "../src/react-query/index.ts";

export type SpecInput = {
  paths?: Record<string, unknown>;
  components?: { schemas?: Record<string, unknown> };
  info?: { title?: string; version?: string };
};

function snapshotHeader(spec: SpecInput): string {
  const title = expect.getState().currentTestName ?? "<unknown test>";
  const yaml = stringifyYaml(spec).trimEnd();
  const commented = yaml
    .split("\n")
    .map((line) => `// ${line}`)
    .join("\n");
  return `// Test: ${title}\n//\n// Spec:\n${commented}\n\n`;
}

export async function matchSnapshot(spec: SpecInput, generated: string, path: string) {
  await expect(snapshotHeader(spec) + generated).toMatchFileSnapshot(path);
}

type ZodOpts = Omit<ZodGeneratorOptions, "output">;
type FetchOpts = Omit<Parameters<typeof createFetchGenerator>[0], "output" | "schemaGenerator">;
type ReactQueryOpts = Omit<
  Parameters<typeof createReactQueryGenerator>[0],
  "output" | "requestGenerator"
>;

async function withTempDir<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(join(tmpdir(), "openapi-generator-test-"));
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function writeSpec(dir: string, spec: SpecInput): Promise<string> {
  const fullSpec = {
    openapi: "3.1.0",
    info: { title: "Test", version: "1.0.0", ...spec.info },
    paths: spec.paths ?? {},
    ...(spec.components ? { components: spec.components } : {}),
  };
  const path = join(dir, "schema.json");
  await writeFile(path, JSON.stringify(fullSpec));
  return path;
}

export async function runZod(spec: SpecInput, opts: ZodOpts = {}): Promise<string> {
  return withTempDir(async (dir) => {
    const schemaPath = await writeSpec(dir, spec);
    const schemasPath = join(dir, "schemas.ts");
    const config = defineConfig({ schema: schemaPath })
      .addBuilder("schemas", createZodGenerator({ ...opts, output: schemasPath }))
      .build();
    await generate(config);
    return readFile(schemasPath, "utf-8");
  });
}

export async function runFetch(spec: SpecInput, opts: FetchOpts = {}): Promise<string> {
  return withTempDir(async (dir) => {
    const schemaPath = await writeSpec(dir, spec);
    const schemasPath = join(dir, "schemas.ts");
    const fetchPath = join(dir, "fetch.ts");
    const config = defineConfig({ schema: schemaPath })
      .addBuilder("schemas", createZodGenerator({ output: schemasPath }))
      .addBuilder(
        "fetch",
        createFetchGenerator({ ...opts, output: fetchPath, schemaGenerator: "schemas" }),
      )
      .build();
    await generate(config);
    return readFile(fetchPath, "utf-8");
  });
}

export async function runReactQuery(spec: SpecInput, opts: ReactQueryOpts = {}): Promise<string> {
  return withTempDir(async (dir) => {
    const schemaPath = await writeSpec(dir, spec);
    const schemasPath = join(dir, "schemas.ts");
    const fetchPath = join(dir, "fetch.ts");
    const apiPath = join(dir, "api.ts");
    const config = defineConfig({ schema: schemaPath })
      .addBuilder("schemas", createZodGenerator({ output: schemasPath }))
      .addBuilder("fetch", createFetchGenerator({ output: fetchPath, schemaGenerator: "schemas" }))
      .addBuilder(
        "api",
        createReactQueryGenerator({ ...opts, output: apiPath, requestGenerator: "fetch" }),
      )
      .build();
    await generate(config);
    return readFile(apiPath, "utf-8");
  });
}
