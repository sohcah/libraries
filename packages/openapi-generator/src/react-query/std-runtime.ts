export class ApiError<
  T extends { code: number; contentType: string; response: unknown },
> extends Error {
  result: T;
  readonly isResponse: true = true;

  get code(): T["code"] {
    return this.result.code;
  }
  get contentType(): T["contentType"] {
    return this.result.contentType;
  }
  get response(): T["response"] {
    return this.result.response;
  }

  constructor(result: T) {
    super(`API error: ${result.code}`);
    this.result = result;
  }
}

type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type SuccessCode = `2${Digit}${Digit}` extends `${infer N extends number}` ? N : never;

type ApiErrorType<T extends { code: number; contentType: string; response: unknown }> = T extends {
  code: SuccessCode;
}
  ? never
  : ApiError<T>;

export function getApiResult<T extends { code: number; contentType: string; response: unknown }>(
  result: T,
):
  | {
      type: "success";
      data: Extract<T, { code: SuccessCode }>["response"];
    }
  | {
      type: "error";
      error: ApiErrorType<T> & Error;
    } {
  if (result.code >= 200 && result.code < 300) {
    return {
      type: "success",
      data: result.response as Extract<T, { code: SuccessCode }>["response"],
    };
  }
  return {
    type: "error",
    error: new ApiError(result) as ApiErrorType<T> & Error,
  };
}

export class UnexpectedError extends Error {
  readonly isResponse: false = false;
  constructor(error: unknown) {
    super("Unexpected error", { cause: error });
  }
}

export function getUnexpectedResult(error: unknown): {
  type: "error";
  error: UnexpectedError;
} {
  return {
    type: "error",
    error: new UnexpectedError(error),
  };
}
