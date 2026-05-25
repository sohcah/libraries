// Test: queries > query supports skipToken via union with parameters
//
// Spec:
// paths:
//   /users/{userId}:
//     get:
//       operationId: getUser
//       parameters:
//         - name: userId
//           in: path
//           required: true
//           schema:
//             type: string
//       responses:
//         "200":
//           description: OK
//           content:
//             application/json:
//               schema:
//                 type: object

import { type QueryClient, type SkipToken, queryOptions, type QueryKey, skipToken } from "@tanstack/react-query";
import type { z } from "zod";
import type { GetUser_Parameters, GetUser_Response } from "./schemas.ts";
import type { FetchApi } from "./fetch.ts";
import { getApiResult, getUnexpectedResult } from "@sohcah/openapi-generator/react-query/std-runtime";
type QuerySuccess<T extends {
  code: number;
  contentType?: string;
  response: unknown;
}> = Extract<ReturnType<typeof getApiResult<T>> | ReturnType<typeof getUnexpectedResult>, {
  type: "success";
}>["data"];
type QueryError<T extends {
  code: number;
  contentType?: string;
  response: unknown;
}> = Extract<ReturnType<typeof getApiResult<T>> | ReturnType<typeof getUnexpectedResult>, {
  type: "error";
}>["error"];
export class Api {
  constructor(api: FetchApi, queryClient: QueryClient) {
    this.#api = api;
    this.#queryClient = queryClient;
  }
  #api;
  #queryClient;
  async getUser(parameters: z.output<typeof GetUser_Parameters>) {
    const result = await this.#api.getUser(parameters).then(getApiResult, getUnexpectedResult);
    if (result.type === "success") return result.data;
    throw result.error;
  }
  getUserQuery(parameters: z.output<typeof GetUser_Parameters> | SkipToken) {
    return queryOptions<QuerySuccess<z.output<typeof GetUser_Response>>, QueryError<z.output<typeof GetUser_Response>>, QuerySuccess<z.output<typeof GetUser_Response>>, QueryKey>({
      queryKey: ["GetUser", parameters] as QueryKey,
      queryFn: parameters === skipToken ? skipToken : async () => await this.getUser(parameters)
    });
  }
  get invalidate() {
    return new ApiInvalidator(this.#queryClient);
  }
}
class ApiInvalidator {
  #queryClient: QueryClient;
  constructor(queryClient: QueryClient) {
    this.#queryClient = queryClient;
  }
  async getUser(parameters?: Partial<z.output<typeof GetUser_Parameters>>) {
    return await this.#queryClient.invalidateQueries({
      queryKey: ["GetUser", ...(parameters ? [parameters] : [])]
    });
  }
}