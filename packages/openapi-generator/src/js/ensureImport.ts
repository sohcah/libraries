import * as t from "@babel/types";
import { relative, dirname, sep } from "node:path";
import type { JsDocument } from "./index.ts";

export function ensureImport(
  imports: t.ImportDeclaration[],
  name: string,
  from: string,
  typeOnly: boolean = false,
) {
  const identifier = t.identifier(name);

  let importDeclaration = imports.find((i) => i.source.value === from);
  if (!importDeclaration) {
    importDeclaration = t.importDeclaration([], t.stringLiteral(from));
    importDeclaration.importKind = typeOnly ? "type" : "value";
    imports.push(importDeclaration);
  }

  if (!typeOnly && importDeclaration.importKind === "type") {
    importDeclaration.importKind = "value";
    for (const specific of importDeclaration.specifiers) {
      if (specific.type === "ImportSpecifier") {
        specific.importKind = "type";
      }
    }
  }

  let importSpecifier = importDeclaration.specifiers.find(
    (s) => s.type === "ImportSpecifier" && s.local.name === name,
  ) as t.ImportSpecifier | undefined;
  if (!importSpecifier) {
    importSpecifier = t.importSpecifier(identifier, identifier);
    importSpecifier.importKind = importDeclaration.importKind === "type" ? "value" : "type";
    importDeclaration.specifiers.push(importSpecifier);
  }

  if (!typeOnly && importSpecifier.importKind === "type") {
    importSpecifier.importKind = "value";
  }

  return identifier;
}

export type ImportExtensionsBehaviour = "retain" | "remove" | ".js";

export function relativeImportPath(
  from: string,
  to: string,
  behaviour: ImportExtensionsBehaviour = "retain",
) {
  const basePath = relative(dirname(from), to).split(sep).join("/");
  const path = basePath.startsWith(".") ? basePath : "./" + basePath;
  if (behaviour === "remove") {
    return path.replace(/\.[^\.]+$/, "");
  }
  if (behaviour === ".js") {
    return path.replace(/\.[^\.]+$/, ".js");
  }
  return path;
}

export function relativeImportPathFromDocument(from: JsDocument, to: JsDocument) {
  return relativeImportPath(from.path, to.path, from.importExtensions);
}
