import { describe, test } from "vitest";
import { matchSnapshot, runFetch, type SpecInput } from "./helpers.ts";

async function snapshotFetch(name: string, spec: SpecInput, opts?: Parameters<typeof runFetch>[1]) {
  const out = await runFetch(spec, opts);
  await matchSnapshot(spec, out, `./snapshots/fetch/${name}.snap.ts`);
}

const jsonOk: Record<string, unknown> = {
  "200": {
    description: "OK",
    content: { "application/json": { schema: { type: "object" } } },
  },
};

describe("operations", () => {
  test("single GET locks in class skeleton + method body shape", async () => {
    await snapshotFetch("basic", {
      paths: { "/users": { get: { operationId: "listUsers", responses: jsonOk } } },
    });
  });

  test("multiple operations accumulate as methods on the same class", async () => {
    await snapshotFetch("multiple-operations", {
      paths: {
        "/users": {
          get: { operationId: "listUsers", responses: jsonOk },
          post: {
            operationId: "createUser",
            requestBody: { content: { "application/json": { schema: { type: "object" } } } },
            responses: jsonOk,
          },
        },
        "/users/{id}": {
          get: {
            operationId: "getUser",
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: jsonOk,
          },
        },
      },
    });
  });
});

describe("options", () => {
  test("custom className", async () => {
    await snapshotFetch(
      "custom-class-name",
      { paths: { "/ping": { get: { operationId: "ping", responses: jsonOk } } } },
      { className: "MyHttpClient" },
    );
  });
});
