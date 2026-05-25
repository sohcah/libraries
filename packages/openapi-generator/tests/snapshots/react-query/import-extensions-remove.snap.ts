// Test: options > importExtensions: remove strips file extensions on relative imports
//
// Spec:
// paths:
//   /users:
//     get:
//       operationId: listUsers
//       responses:
//         "200":
//           description: OK
//           content:
//             application/json:
//               schema:
//                 type: object

import { type QueryClient, type SkipToken, queryOptions, type QueryKey, skipToken } from "@tanstack/react-query";
import type { z } from "zod";
import type { ListUsers_Parameters, ListUsers_Response } from "./schemas";
import type { FetchApi } from "./fetch";
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
  async listUsers(parameters: z.output<typeof ListUsers_Parameters>) {
    const result = await this.#api.listUsers(parameters).then(getApiResult, getUnexpectedResult);
    if (result.type === "success") return result.data;
    throw result.error;
  }
  listUsersQuery(parameters: z.output<typeof ListUsers_Parameters> | SkipToken) {
    return queryOptions<QuerySuccess<z.output<typeof ListUsers_Response>>, QueryError<z.output<typeof ListUsers_Response>>, QuerySuccess<z.output<typeof ListUsers_Response>>, QueryKey>({
      queryKey: ["ListUsers", parameters] as QueryKey,
      queryFn: parameters === skipToken ? skipToken : async () => await this.listUsers(parameters)
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
  async listUsers(parameters?: Partial<z.output<typeof ListUsers_Parameters>>) {
    return await this.#queryClient.invalidateQueries({
      queryKey: ["ListUsers", ...(parameters ? [parameters] : [])]
    });
  }
}