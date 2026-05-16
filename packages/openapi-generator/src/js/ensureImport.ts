import * as t from "@babel/types";
import { relative, dirname } from "node:path/posix";

export function ensureImport(
  imports: t.ImportDeclaration[],
  name: string,
  from: string,
  typeOnly: boolean = false,
) {
  const identifier = t.identifier(name);

  let existingImport = imports.find((i) => i.source.value === from);
  if (!existingImport) {
    existingImport = t.importDeclaration([], t.stringLiteral(from));
    imports.push(existingImport);
  }
  if (
    !existingImport.specifiers.find(
      (s) => s.type === "ImportSpecifier" && s.local.name === name,
    )
  ) {
    const specifier = t.importSpecifier(identifier, identifier);
    if (typeOnly) specifier.importKind = "type";
    existingImport.specifiers.push(specifier);
  }

  return identifier;
}

export function ensureNamespaceImport(
  imports: t.ImportDeclaration[],
  name: string,
  from: string,
) {
  const identifier = t.identifier(name);

  const existingImport = imports.find((i) => i.source.value === from);
  if (existingImport) {
    if (
      !existingImport.specifiers.find(
        (s) => s.type === "ImportNamespaceSpecifier" && s.local.name === name,
      )
    ) {
      existingImport.specifiers.push(t.importNamespaceSpecifier(identifier));
    }
    return identifier;
  }

  imports.push(
    t.importDeclaration(
      [t.importNamespaceSpecifier(identifier)],
      t.stringLiteral(from),
    ),
  );
  return identifier;
}

export type ImportExtensionsBehaviour = "retain" | "remove" | ".js";

export function relativeImportPath(
  from: string,
  to: string,
  behaviour: ImportExtensionsBehaviour = "retain",
) {
  const basePath = relative(dirname(from), to);
  const path = basePath.startsWith(".") ? basePath : "./" + basePath;
  if (behaviour === "remove") {
    return path.replace(/\.[^\.]+$/, "");
  }
  if (behaviour === ".js") {
    return path.replace(/\.[^\.]+$/, ".js");
  }
  return path;
}
