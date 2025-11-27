import { Data, Effect } from "effect";
import { DocumentContext } from "../context.js";
import * as t from "@babel/types";
import { NotImplementedError } from "../errors.js";

export const ensureImport = Effect.fn(function* (
  name: string,
  from: string,
  typeOnly: boolean = false
) {
  const ctx = yield* DocumentContext;

  const identifier = t.identifier(name);

  const existingImport = ctx.imports.find((i) => i.source.value === from);
  if (existingImport) {
    if (
      !existingImport.specifiers.find(
        (s) => s.type === "ImportSpecifier" && s.local.name === name
      )
    ) {
      const specifier = t.importSpecifier(identifier, identifier);
      if (typeOnly) specifier.importKind = "type";
      existingImport.specifiers.push(specifier);
    }
    return identifier;
  }

  ctx.imports.push(
    t.importDeclaration(
      [t.importSpecifier(identifier, identifier)],
      t.stringLiteral(from)
    )
  );
  return identifier;
});

export const ensureNamespaceImport = Effect.fn(function* (
  name: string,
  from: string
) {
  const ctx = yield* DocumentContext;

  const identifier = t.identifier(name);

  const existingImport = ctx.imports.find((i) => i.source.value === from);
  if (existingImport) {
    if (
      !existingImport.specifiers.find(
        (s) => s.type === "ImportNamespaceSpecifier" && s.local.name === name
      )
    ) {
      existingImport.specifiers.push(t.importNamespaceSpecifier(identifier));
    }
    return identifier;
  }

  ctx.imports.push(
    t.importDeclaration(
      [t.importNamespaceSpecifier(identifier)],
      t.stringLiteral(from)
    )
  );
  return identifier;
});

export const getKey = Effect.fn(function* (name: string) {
  if (!name) {
    return yield* new NotImplementedError({
      message: "key for empty name",
    });
  }
  const safeName = name.replace(/[^a-zA-Z0-9]/g, "_");
  return {
    lower: `${safeName[0]!.toLowerCase()}${safeName.slice(1)}`,
    upper: `${safeName[0]!.toUpperCase()}${safeName.slice(1)}`,
  };
});

export type OperationKey = {
  lower: string;
  upper: string;
};

export const httpMethods = [
  "get",
  "post",
  "put",
  "delete",
  "options",
  "head",
  "patch",
  "trace"
] as const;

export type HttpMethod = (typeof httpMethods)[number];