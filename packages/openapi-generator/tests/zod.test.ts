import { describe, test } from "vitest";
import { matchSnapshot, runZod, type SpecInput } from "./helpers.ts";

async function snapshotZod(name: string, spec: SpecInput, opts?: Parameters<typeof runZod>[1]) {
  const out = await runZod(spec, opts);
  await matchSnapshot(spec, out, `./snapshots/zod/${name}.snap.ts`);
}

const componentSchema = (schema: unknown): SpecInput => ({
  components: { schemas: { Thing: schema as Record<string, unknown> } },
});

describe("primitives", () => {
  test.for([
    ["string", { type: "string" }],
    ["number", { type: "number" }],
    ["integer", { type: "integer" }],
    ["boolean", { type: "boolean" }],
    ["null", { type: "null" }],
  ] as const)("primitive %s", async ([name, schema]) => {
    await snapshotZod(`primitive-${name}`, componentSchema(schema));
  });
});

describe("strings", () => {
  test("binary string emits Blob codec", async () => {
    await snapshotZod("string-binary", componentSchema({ type: "string", format: "binary" }));
  });

  test("contentMediaType emits Blob codec", async () => {
    await snapshotZod(
      "string-content-media-type",
      componentSchema({ type: "string", contentMediaType: "image/png" }),
    );
  });
});

describe("objects", () => {
  test("required and optional properties", async () => {
    await snapshotZod(
      "object-required-optional",
      componentSchema({
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
        },
        required: ["id"],
      }),
    );
  });

  test("additionalProperties as schema", async () => {
    await snapshotZod(
      "object-additional-properties-schema",
      componentSchema({
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
        additionalProperties: { type: "number" },
      }),
    );
  });

  test("additionalProperties: true", async () => {
    await snapshotZod(
      "object-additional-properties-true",
      componentSchema({ type: "object", additionalProperties: true }),
    );
  });
});

describe("collections", () => {
  test("array of strings", async () => {
    await snapshotZod(
      "array-of-strings",
      componentSchema({ type: "array", items: { type: "string" } }),
    );
  });

  test("enum of strings", async () => {
    await snapshotZod(
      "enum-of-strings",
      componentSchema({ type: "string", enum: ["a", "b", "c"] }),
    );
  });

  test("const literal", async () => {
    await snapshotZod("const-literal", componentSchema({ const: "fixed" }));
  });

  test("type as array (e.g. ['string', 'null'])", async () => {
    await snapshotZod("type-array-nullable", componentSchema({ type: ["string", "null"] }));
  });
});

describe("composition", () => {
  test("allOf merges schemas", async () => {
    await snapshotZod("all-of", {
      components: {
        schemas: {
          Base: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
          Extended: {
            allOf: [
              { $ref: "#/components/schemas/Base" },
              { type: "object", properties: { name: { type: "string" } }, required: ["name"] },
            ],
          },
        },
      },
    });
  });

  test("oneOf produces a union", async () => {
    await snapshotZod(
      "one-of-union",
      componentSchema({
        oneOf: [{ type: "string" }, { type: "number" }],
      }),
    );
  });

  test("discriminated union via oneOf + discriminator", async () => {
    await snapshotZod("discriminated-union", {
      components: {
        schemas: {
          Cat: {
            type: "object",
            properties: { kind: { type: "string" }, meow: { type: "boolean" } },
            required: ["kind", "meow"],
          },
          Dog: {
            type: "object",
            properties: { kind: { type: "string" }, bark: { type: "boolean" } },
            required: ["kind", "bark"],
          },
          Animal: {
            type: "object",
            oneOf: [{ $ref: "#/components/schemas/Cat" }, { $ref: "#/components/schemas/Dog" }],
            discriminator: {
              propertyName: "kind",
              mapping: {
                cat: "#/components/schemas/Cat",
                dog: "#/components/schemas/Dog",
              },
            },
          },
        },
      },
    });
  });

  test("nullable via union with null collapses to .nullable()", async () => {
    await snapshotZod(
      "nullable-string",
      componentSchema({ oneOf: [{ type: "string" }, { type: "null" }] }),
    );
  });
});

describe("$ref handling", () => {
  test("referenced schemas are emitted as named consts", async () => {
    await snapshotZod("ref-named", {
      components: {
        schemas: {
          User: {
            type: "object",
            properties: { id: { type: "string" } },
            required: ["id"],
          },
          UserList: {
            type: "array",
            items: { $ref: "#/components/schemas/User" },
          },
        },
      },
    });
  });
});

describe("options", () => {
  test("includeTypeAnnotations: true emits type annotations on schema consts", async () => {
    await snapshotZod("include-type-annotations", componentSchema({ type: "string" }), {
      includeTypeAnnotations: true,
    });
  });

  test("overrideFormats redirects a format to an external schema", async () => {
    await snapshotZod(
      "override-formats",
      componentSchema({ type: "string", format: "date-time" }),
      {
        overrideFormats: {
          "date-time": { type: "import", name: "dateTimeSchema", from: "./custom.ts" },
        },
      },
    );
  });

  test("overrideSchema redirects a schema to an external schema", async () => {
    await snapshotZod("override-schema", componentSchema({ type: "string", format: "uuid" }), {
      overrideSchema: (schema) =>
        "format" in schema && schema.format === "uuid"
          ? { type: "import", name: "uuidSchema", from: "./custom.ts" }
          : null,
    });
  });
});

describe("operations", () => {
  test("application/json request body", async () => {
    await snapshotZod("op-json-body", {
      paths: {
        "/users": {
          post: {
            operationId: "createUser",
            requestBody: {
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { name: { type: "string" } },
                    required: ["name"],
                  },
                },
              },
            },
            responses: {
              "201": {
                description: "Created",
                content: { "application/json": { schema: { type: "object" } } },
              },
            },
          },
        },
      },
    });
  });

  test("multipart/form-data request body", async () => {
    await snapshotZod("op-multipart-body", {
      paths: {
        "/upload": {
          post: {
            operationId: "uploadFile",
            requestBody: {
              content: {
                "multipart/form-data": {
                  schema: {
                    type: "object",
                    properties: {
                      file: { type: "string", format: "binary" },
                      caption: { type: "string" },
                    },
                    required: ["file"],
                  },
                },
              },
            },
            responses: { "204": { description: "No Content" } },
          },
        },
      },
    });
  });

  test("path/query/header parameters", async () => {
    await snapshotZod("op-parameters", {
      paths: {
        "/users/{userId}": {
          get: {
            operationId: "getUser",
            parameters: [
              { name: "userId", in: "path", required: true, schema: { type: "string" } },
              { name: "include", in: "query", schema: { type: "string" } },
              { name: "X-Trace", in: "header", schema: { type: "string" } },
            ],
            responses: {
              "200": {
                description: "OK",
                content: { "application/json": { schema: { type: "object" } } },
              },
            },
          },
        },
      },
    });
  });

  test("array query parameter encodes via for-of append", async () => {
    await snapshotZod("op-array-query-param", {
      paths: {
        "/items": {
          get: {
            operationId: "listItems",
            parameters: [
              { name: "tags", in: "query", schema: { type: "array", items: { type: "string" } } },
            ],
            responses: {
              "200": {
                description: "OK",
                content: { "application/json": { schema: { type: "object" } } },
              },
            },
          },
        },
      },
    });
  });

  test("number query parameter is coerced to string via String()", async () => {
    await snapshotZod("op-number-query-param", {
      paths: {
        "/items": {
          get: {
            operationId: "listItems",
            parameters: [{ name: "limit", in: "query", schema: { type: "integer" } }],
            responses: {
              "200": {
                description: "OK",
                content: { "application/json": { schema: { type: "object" } } },
              },
            },
          },
        },
      },
    });
  });

  test("blob response (application/octet-stream)", async () => {
    await snapshotZod("op-blob-response", {
      paths: {
        "/download": {
          get: {
            operationId: "download",
            responses: {
              "200": {
                description: "OK",
                content: {
                  "application/octet-stream": { schema: { type: "string", format: "binary" } },
                },
              },
            },
          },
        },
      },
    });
  });

  test("header parameter with unsupported (object) type warns", async () => {
    await snapshotZod("op-unsupported-header-param", {
      paths: {
        "/items": {
          get: {
            operationId: "listItems",
            parameters: [
              {
                name: "X-Filter",
                in: "header",
                schema: { type: "object", properties: { x: { type: "string" } } },
              },
            ],
            responses: {
              "200": {
                description: "OK",
                content: { "application/json": { schema: { type: "object" } } },
              },
            },
          },
        },
      },
    });
  });

  test("query parameter with unsupported (object) type warns", async () => {
    await snapshotZod("op-unsupported-query-param", {
      paths: {
        "/items": {
          get: {
            operationId: "listItems",
            parameters: [
              {
                name: "filter",
                in: "query",
                schema: { type: "object", properties: { x: { type: "string" } } },
              },
            ],
            responses: {
              "200": {
                description: "OK",
                content: { "application/json": { schema: { type: "object" } } },
              },
            },
          },
        },
      },
    });
  });

  test("query parameter via single-element allOf", async () => {
    await snapshotZod("op-allof-query-param", {
      paths: {
        "/items": {
          get: {
            operationId: "listItems",
            parameters: [
              {
                name: "id",
                in: "query",
                schema: { allOf: [{ type: "string" }] },
              },
            ],
            responses: {
              "200": {
                description: "OK",
                content: { "application/json": { schema: { type: "object" } } },
              },
            },
          },
        },
      },
    });
  });

  test("unsupported request body content type warns and falls through", async () => {
    await snapshotZod("op-unsupported-body-type", {
      paths: {
        "/raw": {
          post: {
            operationId: "raw",
            requestBody: {
              content: { "text/plain": { schema: { type: "string" } } },
            },
            responses: { "204": { description: "No Content" } },
          },
        },
      },
    });
  });

  test("non-numeric status code is skipped with a warn", async () => {
    await snapshotZod("op-non-numeric-status", {
      paths: {
        "/users": {
          get: {
            operationId: "listUsers",
            responses: {
              "200": {
                description: "OK",
                content: { "application/json": { schema: { type: "object" } } },
              },
              default: { description: "Default" },
            },
          },
        },
      },
    });
  });

  test("response with content but no schema falls through (warn)", async () => {
    await snapshotZod("op-content-no-schema", {
      paths: {
        "/raw": {
          get: {
            operationId: "raw",
            responses: {
              "200": {
                description: "OK",
                content: { "text/plain": {} },
              },
            },
          },
        },
      },
    });
  });

  test("operation without operationId derives key from method + path", async () => {
    await snapshotZod("op-no-operation-id", {
      paths: {
        "/users/folders": {
          get: {
            responses: {
              "200": {
                description: "OK",
                content: { "application/json": { schema: { type: "object" } } },
              },
            },
          },
        },
      },
    });
  });

  test("operation without operationId sanitizes invalid identifier characters in path", async () => {
    await snapshotZod("op-no-operation-id-path-params", {
      paths: {
        "/users/{id}": {
          get: {
            parameters: [
              { name: "id", in: "path", required: true, schema: { type: "string" } },
            ],
            responses: {
              "200": {
                description: "OK",
                content: { "application/json": { schema: { type: "object" } } },
              },
            },
          },
        },
      },
    });
  });

  test("204 no-content response", async () => {
    await snapshotZod("op-no-content", {
      paths: {
        "/ping": {
          post: {
            operationId: "ping",
            responses: { "204": { description: "No Content" } },
          },
        },
      },
    });
  });
});
