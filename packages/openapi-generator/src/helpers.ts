import type { OperationReference } from "./core.js";

export function first(value: string, upperLower: "upper" | "lower") {
  if (!value) return value;
  return `${value[0]![upperLower === "upper" ? "toUpperCase" : "toLowerCase"]()}${value.slice(1)}`;
}

export function getOperationKey(ref: OperationReference, firstLetter: "upper" | "lower" = "upper") {
  return first(
    ref.operation.operationId ??
      `${ref.methodKey}${first(
        ref.pathKey.replace(/\/(.?)/g, (_, g) => g.toUpperCase()),
        "upper",
      )}`,
    firstLetter,
  );
}
