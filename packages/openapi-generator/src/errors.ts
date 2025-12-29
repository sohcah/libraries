import { Data } from "effect";

export class NotImplementedError extends Data.Error<{ message: string }> {}

export class FailedToUpgradeOpenApiDocumentError extends Data.Error<{ cause: unknown }> {}