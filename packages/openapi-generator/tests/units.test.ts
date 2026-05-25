import { describe, test, expect } from "vitest";
import * as t from "@babel/types";
import { generate } from "@babel/generator";
import { defineConfig } from "../src/config.ts";
import { dereference, dereferenceSchema } from "../src/core.ts";
import { first, getOperationKey } from "../src/helpers.ts";
import { ensureImport, relativeImportPath } from "../src/js/ensureImport.ts";
import { runZod } from "./helpers.ts";

describe("defineConfig", () => {
  test("exposes the schema path via the builder getter", () => {
    const builder = defineConfig({ schema: "./schema.yaml" });
    expect(builder.schema).toBe("./schema.yaml");
  });
});

describe("dereference helpers", () => {
  test("dereference resolves $ref-value", () => {
    const target = { foo: "bar" };
    const ref = { $ref: "#/components/schemas/Foo", "$ref-value": target } as const;
    expect(dereference(ref as any)).toBe(target);
  });

  test("dereference returns the input when there is no $ref-value", () => {
    const value = { foo: "bar" };
    expect(dereference(value as any)).toBe(value);
  });

  test("dereferenceSchema resolves $ref-value", () => {
    const target = { type: "string" } as const;
    expect(
      dereferenceSchema({ $ref: "#/components/schemas/Foo", "$ref-value": target } as any),
    ).toBe(target);
  });
});

describe("helpers.first", () => {
  test("returns an empty string unchanged", () => {
    expect(first("", "upper")).toBe("");
  });

  test("uppercases the first letter", () => {
    expect(first("hello", "upper")).toBe("Hello");
  });

  test("lowercases the first letter", () => {
    expect(first("HELLO", "lower")).toBe("hELLO");
  });
});

describe("helpers.getOperationKey", () => {
  test("falls back to method + path when operationId is missing", () => {
    expect(
      getOperationKey({
        pathKey: "/users/folders",
        methodKey: "get",
        operation: {},
      } as any),
    ).toBe("GetUsersFolders");
  });

  test("uses operationId when present", () => {
    expect(
      getOperationKey({
        pathKey: "/users",
        methodKey: "get",
        operation: { operationId: "listUsers" },
      } as any),
    ).toBe("ListUsers");
  });
});

describe("ensureImport", () => {
  test("upgrades a type-only default import declaration to value when adding a value import", () => {
    const imports: t.ImportDeclaration[] = [
      Object.assign(
        t.importDeclaration(
          [t.importDefaultSpecifier(t.identifier("Default"))],
          t.stringLiteral("mod"),
        ),
        { importKind: "type" as const },
      ),
    ];
    ensureImport(imports, "Named", "mod", false);
    const code = generate(t.program([...imports])).code;
    expect(code).toBe('import Default, { Named } from "mod";');
  });

  test("upgrades existing import specifiers to type-only when promoting the declaration to value", () => {
    const imports: t.ImportDeclaration[] = [];
    ensureImport(imports, "First", "mod", true);
    ensureImport(imports, "Second", "mod", false);
    const code = generate(t.program([...imports])).code;
    expect(code).toBe('import { type First, Second } from "mod";');
  });

  test("promotes an existing type-only specifier to value when re-requested as a value", () => {
    const imports: t.ImportDeclaration[] = [];
    ensureImport(imports, "Foo", "mod", true);
    ensureImport(imports, "Foo", "mod", false);
    const code = generate(t.program([...imports])).code;
    expect(code).toBe('import { Foo } from "mod";');
  });
});

describe("generate edge cases", () => {
  test("a null path item is skipped without crashing", async () => {
    const out = await runZod({
      paths: {
        "/users": { get: { operationId: "listUsers", responses: {} } },
        "/empty": null as unknown as Record<string, unknown>,
      },
    });
    expect(out).toContain("ListUsers_Parameters");
  });

  test("a null component schema is skipped without crashing", async () => {
    const out = await runZod({
      components: {
        schemas: {
          Real: { type: "string" } as Record<string, unknown>,
          Empty: null as unknown as Record<string, unknown>,
        },
      },
    });
    expect(out).toContain("export const Real");
    expect(out).not.toContain("export const Empty");
  });

  test("$ref-only entries inside components.schemas are followed as references", async () => {
    const out = await runZod({
      components: {
        schemas: {
          Real: { type: "string" } as Record<string, unknown>,
          Alias: { $ref: "#/components/schemas/Real" } as Record<string, unknown>,
        },
      },
    });
    expect(out).toContain("export const Real");
  });
});

describe("relativeImportPath", () => {
  test("retains extensions by default", () => {
    expect(relativeImportPath("/a/b/from.ts", "/a/b/to.ts")).toBe("./to.ts");
  });

  test("prepends ./ for sibling files that node:path does not mark relative", () => {
    expect(relativeImportPath("/from.ts", "/dir/to.ts")).toBe("./dir/to.ts");
  });

  test("retains a parent-relative path without adding an extra ./", () => {
    expect(relativeImportPath("/a/b/from.ts", "/a/to.ts")).toBe("../to.ts");
  });

  test("removes extensions when requested", () => {
    expect(relativeImportPath("/a/b/from.ts", "/a/b/to.ts", "remove")).toBe("./to");
  });

  test("rewrites extensions to .js when requested", () => {
    expect(relativeImportPath("/a/b/from.ts", "/a/b/to.ts", ".js")).toBe("./to.js");
  });
});
