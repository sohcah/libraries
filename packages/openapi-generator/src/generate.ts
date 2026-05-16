import type { OpenApiConfig } from "./config.js";
import { bundle } from "@scalar/json-magic/bundle";
import { readFiles, fetchUrls } from "@scalar/json-magic/bundle/plugins/node";
import { upgrade } from "@scalar/openapi-upgrader";
import {
  type ApiDocument,
  type OpenApiGenerator,
} from "./core.js";
import { createMagicProxy } from "@scalar/json-magic/magic-proxy";
import { writeFileSync } from "fs";

export async function generate<
  Builders extends Record<string, OpenApiGenerator>,
>(config: OpenApiConfig<Builders>) {
  const bundled = await bundle(config.schema, {
    plugins: [readFiles(), fetchUrls({ limit: 5 })],
    treeShake: false,
  });
  const upgraded = upgrade(bundled as any, "3.2");
  const document: ApiDocument = createMagicProxy(upgraded) as ApiDocument;
  const buildersList = Object.values(config.builders);

  for (const pathKey in document.paths) {
    const pathItem = document.paths[pathKey];
    if (!pathItem) continue;
    for (const methodKey of [
      "get",
      "put",
      "post",
      "delete",
      "options",
      "head",
      "patch",
      "trace",
      // "query",
    ] as const) {
      const operation = pathItem[methodKey];
      if (!operation) continue;
      for (const builder of buildersList) {
        await builder.visitOperation?.(document, {
          pathKey,
          methodKey,
          operation,
        });
      }
    }
  }

  for (const schemaKey in document.components?.schemas) {
    const schema = document.components.schemas[schemaKey];
    if (!schema) continue;
    for (const builder of buildersList) {
      await builder.visitSchema?.(
        document,
        "$ref" in schema
          ? schema
          : {
              $ref: `#/components/schemas/${schemaKey}`,
              "$ref-value": schema,
            },
      );
    }
  }

  for (const builder of buildersList) {
    await builder.complete();
  }

  writeFileSync("swagger.json", JSON.stringify(bundled, null, 2));
}
