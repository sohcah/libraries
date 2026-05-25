// Test: mutations > POST produces mutationOptions
//
// Spec:
// paths:
//   /users:
//     post:
//       operationId: createUser
//       requestBody:
//         content:
//           application/json:
//             schema:
//               type: object
//               properties:
//                 name:
//                   type: string
//               required:
//                 - name
//       responses:
//         "201":
//           description: Created
//           content:
//             application/json:
//               schema:
//                 type: object

import { type QueryClient, type SkipToken, mutationOptions } from "@tanstack/react-query";
import type { z } from "zod";
import type { CreateUser_Parameters, CreateUser_Response } from "./schemas.ts";
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
  async createUser(parameters: z.output<typeof CreateUser_Parameters>) {
    const result = await this.#api.createUser(parameters).then(getApiResult, getUnexpectedResult);
    if (result.type === "success") return result.data;
    throw result.error;
  }
  createUserMutation() {
    return mutationOptions<QuerySuccess<z.output<typeof CreateUser_Response>>, QueryError<z.output<typeof CreateUser_Response>>, z.output<typeof CreateUser_Parameters>>({
      mutationFn: async (parameters: z.output<typeof CreateUser_Parameters>) => this.createUser(parameters)
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
}