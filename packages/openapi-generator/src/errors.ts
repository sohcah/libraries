import { Data } from "effect";

export class NotImplementedError extends Data.Error<{ message: string }> {}
