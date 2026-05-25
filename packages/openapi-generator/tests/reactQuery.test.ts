import { describe, test, expect } from "vitest";
import { matchSnapshot, runReactQuery, type SpecInput } from "./helpers.ts";

async function snapshotReactQuery(
  name: string,
  spec: SpecInput,
  opts?: Parameters<typeof runReactQuery>[1],
) {
  const out = await runReactQuery(spec, opts);
  await matchSnapshot(spec, out, `./snapshots/react-query/${name}.snap.ts`);
}

const jsonOk: Record<string, unknown> = {
  "200": {
    description: "OK",
    content: { "application/json": { schema: { type: "object" } } },
  },
};

const jsonCreated: Record<string, unknown> = {
  "201": {
    description: "Created",
    content: { "application/json": { schema: { type: "object" } } },
  },
};

describe("queries", () => {
  test("GET produces queryOptions and an Api class", async () => {
    await snapshotReactQuery("get-query", {
      paths: { "/users": { get: { operationId: "listUsers", responses: jsonOk } } },
    });
  });

  test("query supports skipToken via union with parameters", async () => {
    await snapshotReactQuery("query-skip-token", {
      paths: {
        "/users/{userId}": {
          get: {
            operationId: "getUser",
            parameters: [
              { name: "userId", in: "path", required: true, schema: { type: "string" } },
            ],
            responses: jsonOk,
          },
        },
      },
    });
  });
});

describe("mutations", () => {
  test("POST produces mutationOptions", async () => {
    await snapshotReactQuery("post-mutation", {
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
            responses: jsonCreated,
          },
        },
      },
    });
  });

  test('POST tagged "query" produces queryOptions instead of mutationOptions', async () => {
    await snapshotReactQuery("post-query-tagged", {
      paths: {
        "/search": {
          post: {
            operationId: "search",
            tags: ["query"],
            requestBody: {
              content: {
                "application/json": {
                  schema: { type: "object", properties: { q: { type: "string" } } },
                },
              },
            },
            responses: jsonOk,
          },
        },
      },
    });
  });
});

describe("invalidator", () => {
  test("ApiInvalidator emits methods only for queries (not mutations)", async () => {
    await snapshotReactQuery("invalidator-mixed", {
      paths: {
        "/users": {
          get: { operationId: "listUsers", responses: jsonOk },
          post: {
            operationId: "createUser",
            requestBody: {
              content: { "application/json": { schema: { type: "object" } } },
            },
            responses: jsonCreated,
          },
        },
        "/users/{userId}": {
          get: {
            operationId: "getUser",
            parameters: [
              { name: "userId", in: "path", required: true, schema: { type: "string" } },
            ],
            responses: jsonOk,
          },
          delete: {
            operationId: "deleteUser",
            parameters: [
              { name: "userId", in: "path", required: true, schema: { type: "string" } },
            ],
            responses: { "204": { description: "No Content" } },
          },
        },
      },
    });
  });
});

describe("infinite queries", () => {
  test("basic infinite query coexists alongside the regular query", async () => {
    await snapshotReactQuery(
      "infinite-basic",
      {
        paths: {
          "/users": {
            get: {
              operationId: "listUsers",
              parameters: [{ name: "cursor", in: "query", schema: { type: "string" } }],
              responses: {
                "200": {
                  description: "OK",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          items: { type: "array", items: { type: "object" } },
                          nextCursor: { type: "string" },
                        },
                        required: ["items"],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      { infiniteQueries: ["listUsers"] },
    );
  });

  test("infiniteQueries throws on unknown operation", async () => {
    await expect(
      runReactQuery(
        {
          paths: { "/users": { get: { operationId: "listUsers", responses: jsonOk } } },
        },
        { infiniteQueries: ["doesNotExist"] },
      ),
    ).rejects.toThrow(/infiniteQueries references unknown operation: "doesNotExist"/);
  });

  test("infiniteQueries throws on mutation operation", async () => {
    await expect(
      runReactQuery(
        {
          paths: {
            "/users": {
              post: {
                operationId: "createUser",
                requestBody: {
                  content: { "application/json": { schema: { type: "object" } } },
                },
                responses: jsonCreated,
              },
            },
          },
        },
        { infiniteQueries: ["createUser"] },
      ),
    ).rejects.toThrow(/Operation "createUser" is listed in infiniteQueries but is a mutation/);
  });
});

describe("options", () => {
  test("custom runtime path", async () => {
    await snapshotReactQuery(
      "custom-runtime",
      { paths: { "/users": { get: { operationId: "listUsers", responses: jsonOk } } } },
      { runtime: "./my-runtime.ts" },
    );
  });

  test("importExtensions: remove strips file extensions on relative imports", async () => {
    await snapshotReactQuery(
      "import-extensions-remove",
      { paths: { "/users": { get: { operationId: "listUsers", responses: jsonOk } } } },
      { importExtensions: "remove" },
    );
  });

  test('importExtensions: ".js" rewrites relative imports to .js', async () => {
    await snapshotReactQuery(
      "import-extensions-js",
      { paths: { "/users": { get: { operationId: "listUsers", responses: jsonOk } } } },
      { importExtensions: ".js" },
    );
  });
});
