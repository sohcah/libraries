import { describe, test, expect } from "vitest";
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

  test("enum of numbers and booleans renders numeric/boolean literals", async () => {
    await snapshotZod("enum-mixed-literals", componentSchema({ enum: [1, 2, true, false] }));
  });

  test("const literal", async () => {
    await snapshotZod("const-literal", componentSchema({ const: "fixed" }));
  });

  test("const numeric literal", async () => {
    await snapshotZod("const-number", componentSchema({ const: 42 }));
  });

  test("const boolean literal", async () => {
    await snapshotZod("const-boolean", componentSchema({ const: true }));
  });

  test("type as array (e.g. ['string', 'null'])", async () => {
    await snapshotZod("type-array-nullable", componentSchema({ type: ["string", "null"] }));
  });

  test("type as array with a single entry collapses to that entry's schema", async () => {
    await snapshotZod("type-array-single", componentSchema({ type: ["string"] }));
  });

  test("enum with an unsupported literal type throws", async () => {
    await expect(runZod(componentSchema({ enum: [null] }))).rejects.toThrow(
      /Unsupported literal value/,
    );
  });
});

describe("composition", () => {
  test("allOf of two non-object schemas falls back to intersection", async () => {
    await snapshotZod(
      "all-of-intersection",
      componentSchema({ allOf: [{ type: "string" }, { type: "string" }] }),
    );
  });

  test("allOf where the trailing schema is a $ref-to-object uses .extend(<ref>.shape)", async () => {
    await snapshotZod("all-of-shape-fallback", {
      components: {
        schemas: {
          Base: {
            type: "object",
            properties: { id: { type: "string" } },
            required: ["id"],
          },
          Other: {
            type: "object",
            properties: { name: { type: "string" } },
            required: ["name"],
          },
          Combined: {
            allOf: [{ $ref: "#/components/schemas/Base" }, { $ref: "#/components/schemas/Other" }],
          },
        },
      },
    });
  });

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

  test("allOf containing a discriminator emits a separate _Base schema", async () => {
    // NamedPet is intentionally declared before Pet so that the discriminated
    // schema is first visited via the allOf-with-multiple-items code path
    // (ctx.base = true) which produces the dedicated `_Base` schema.
    await snapshotZod("discriminator-base", {
      components: {
        schemas: {
          NamedPet: {
            allOf: [
              { $ref: "#/components/schemas/Pet" },
              {
                type: "object",
                properties: { name: { type: "string" } },
                required: ["name"],
              },
            ],
          },
          Pet: {
            type: "object",
            oneOf: [{ $ref: "#/components/schemas/Cat" }, { $ref: "#/components/schemas/Dog" }],
            discriminator: {
              propertyName: "kind",
              mapping: {
                cat: "#/components/schemas/Cat",
                dog: "#/components/schemas/Dog",
              },
            },
            properties: { kind: { type: "string" } },
            required: ["kind"],
          },
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
        },
      },
    });
  });

  test("discriminator on an object with additionalProperties still emits a _Base entry", async () => {
    // PetWithMeta is referenced before it is declared so it is first visited
    // via allOf-with-multiple-items (ctx.base = true). The base schema uses
    // `additionalProperties` so #getZodObjectSchema returns without an
    // `isObject` meta, exercising the `?? {}` fall-through.
    await snapshotZod("discriminator-base-additional-properties", {
      components: {
        schemas: {
          NamedPetWithMeta: {
            allOf: [
              { $ref: "#/components/schemas/PetWithMeta" },
              {
                type: "object",
                properties: { name: { type: "string" } },
                required: ["name"],
              },
            ],
          },
          PetWithMeta: {
            type: "object",
            additionalProperties: { type: "string" },
            discriminator: {
              propertyName: "kind",
              mapping: { cat: "#/components/schemas/Cat" },
            },
          },
          Cat: {
            type: "object",
            properties: { kind: { type: "string" }, meow: { type: "boolean" } },
            required: ["kind", "meow"],
          },
        },
      },
    });
  });

  test('discriminator with x-sohcah-extensible-union: true emits a "fall-through" branch', async () => {
    await snapshotZod("discriminator-extensible-union", {
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
            "x-sohcah-extensible-union": true,
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

  test("discriminator mapping must point at #/components/schemas/...", async () => {
    await expect(
      runZod({
        components: {
          schemas: {
            Bad: {
              type: "object",
              discriminator: {
                propertyName: "kind",
                mapping: { foo: "./external.yaml" },
              },
            },
          },
        },
      }),
    ).rejects.toThrow(/Invalid discriminator schema reference/);
  });

  test("discriminator falls back to a plain union when mapped schemas are non-objects", async () => {
    await snapshotZod("discriminator-non-object", {
      components: {
        schemas: {
          Tag: { type: "string" },
          Wrapper: {
            type: "object",
            oneOf: [{ $ref: "#/components/schemas/Tag" }],
            discriminator: {
              propertyName: "kind",
              mapping: { foo: "#/components/schemas/Tag" },
            },
          },
        },
      },
    });
  });

  test("discriminator mapping must reference an existing component schema", async () => {
    await expect(
      runZod({
        components: {
          schemas: {
            Bad: {
              type: "object",
              discriminator: {
                propertyName: "kind",
                mapping: { foo: "#/components/schemas/Missing" },
              },
            },
          },
        },
      }),
    ).rejects.toThrow(/Discriminator schema not found/);
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

describe("extensions", () => {
  test("x-sohcah-brand-id emits a branded schema entry", async () => {
    await snapshotZod(
      "brand-id",
      componentSchema({ type: "string", "x-sohcah-brand-id": "UserId" }),
    );
  });

  test("x-sohcah-brand-id paired with a nullable type-array still produces the brand", async () => {
    await snapshotZod(
      "brand-id-nullable",
      componentSchema({
        type: ["string", "null"],
        "x-sohcah-brand-id": "UserId",
      }),
    );
  });

  test("multiple schemas with the same x-sohcah-brand-id reuse the existing brand entry", async () => {
    await snapshotZod("brand-id-reuse", {
      components: {
        schemas: {
          PrimaryId: { type: "string", "x-sohcah-brand-id": "UserId" },
          SecondaryId: { type: "string", "x-sohcah-brand-id": "UserId" },
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
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
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

  test("multiple no-content responses share the blob response codec", async () => {
    await snapshotZod("op-no-content-multiple", {
      paths: {
        "/ping": {
          post: { operationId: "ping", responses: { "204": { description: "No Content" } } },
        },
        "/pong": {
          post: { operationId: "pong", responses: { "204": { description: "No Content" } } },
        },
      },
    });
  });

  test("multiple json bodies share the json-content encode helper", async () => {
    await snapshotZod("op-json-body-multiple", {
      paths: {
        "/users": {
          post: {
            operationId: "createUser",
            requestBody: {
              content: { "application/json": { schema: { type: "object" } } },
            },
            responses: { "204": { description: "No Content" } },
          },
        },
        "/groups": {
          post: {
            operationId: "createGroup",
            requestBody: {
              content: { "application/json": { schema: { type: "object" } } },
            },
            responses: { "204": { description: "No Content" } },
          },
        },
      },
    });
  });

  test("multiple request body content types produce a union codec", async () => {
    await snapshotZod("op-multi-content-type-body", {
      paths: {
        "/upload": {
          post: {
            operationId: "upload",
            requestBody: {
              content: {
                "application/json": {
                  schema: { type: "object", properties: { name: { type: "string" } } },
                },
                "multipart/form-data": {
                  schema: {
                    type: "object",
                    properties: { file: { type: "string", format: "binary" } },
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

  test("requestBody without a content field is tolerated", async () => {
    await snapshotZod("op-empty-request-body", {
      paths: {
        "/raw": {
          post: {
            operationId: "raw",
            requestBody: {},
            responses: { "204": { description: "No Content" } },
          },
        },
      },
    });
  });

  test("duplicate request body content entries are de-duplicated", async () => {
    await snapshotZod("op-duplicate-content-body", {
      paths: {
        "/upload": {
          post: {
            operationId: "upload",
            requestBody: {
              content: {
                "application/json": { schema: { type: "object" } },
                "application/vnd.api+json": { schema: { type: "object" } },
              },
            },
            responses: { "204": { description: "No Content" } },
          },
        },
      },
    });
  });

  test("application/json request body without a schema is skipped", async () => {
    await snapshotZod("op-json-body-no-schema", {
      paths: {
        "/raw": {
          post: {
            operationId: "raw",
            requestBody: { content: { "application/json": {} } },
            responses: { "204": { description: "No Content" } },
          },
        },
      },
    });
  });

  test("multipart/form-data request body without a schema is skipped", async () => {
    await snapshotZod("op-multipart-no-schema", {
      paths: {
        "/upload": {
          post: {
            operationId: "upload",
            requestBody: { content: { "multipart/form-data": {} } },
            responses: { "204": { description: "No Content" } },
          },
        },
      },
    });
  });

  test("multipart/form-data with an object schema but no properties produces an empty encode", async () => {
    await snapshotZod("op-multipart-empty-object", {
      paths: {
        "/upload": {
          post: {
            operationId: "upload",
            requestBody: {
              content: { "multipart/form-data": { schema: { type: "object" } } },
            },
            responses: { "204": { description: "No Content" } },
          },
        },
      },
    });
  });

  test("multipart/form-data request body with non-object schema warns and skips", async () => {
    await snapshotZod("op-multipart-non-object", {
      paths: {
        "/upload": {
          post: {
            operationId: "upload",
            requestBody: {
              content: { "multipart/form-data": { schema: { type: "string" } } },
            },
            responses: { "204": { description: "No Content" } },
          },
        },
      },
    });
  });

  test("multipart/form-data property with an unsupported (object) schema warns", async () => {
    // No `required` is set so that the optional-property branch of the
    // multipart property encoder is exercised.
    await snapshotZod("op-multipart-unsupported-property", {
      paths: {
        "/upload": {
          post: {
            operationId: "upload",
            requestBody: {
              content: {
                "multipart/form-data": {
                  schema: {
                    type: "object",
                    properties: {
                      meta: { type: "object", properties: { x: { type: "string" } } },
                      caption: { type: "string" },
                    },
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

  test("operation parameter without a schema throws", async () => {
    await expect(
      runZod({
        paths: {
          "/items": {
            get: {
              operationId: "listItems",
              parameters: [{ name: "X", in: "header" }],
              responses: { "204": { description: "No Content" } },
            },
          },
        },
      }),
    ).rejects.toThrow(/Unsupported non-schema parameter X for operation ListItems/);
  });

  test("array query parameter without an items schema falls back to {} items", async () => {
    await snapshotZod("op-array-query-no-items", {
      paths: {
        "/items": {
          get: {
            operationId: "listItems",
            parameters: [{ name: "tags", in: "query", schema: { type: "array" } }],
            responses: { "204": { description: "No Content" } },
          },
        },
      },
    });
  });

  test("array query parameter with non-typed items warns and skips", async () => {
    await snapshotZod("op-array-query-untyped-items", {
      paths: {
        "/items": {
          get: {
            operationId: "listItems",
            parameters: [
              {
                name: "tags",
                in: "query",
                schema: { type: "array", items: { const: "x" } },
              },
            ],
            responses: { "204": { description: "No Content" } },
          },
        },
      },
    });
  });

  test("operation without any responses still emits a discriminated union shell", async () => {
    await snapshotZod("op-no-responses", {
      paths: {
        "/ping": { get: { operationId: "ping" } },
      },
    });
  });
});
