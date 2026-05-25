// Test: invalidator > ApiInvalidator emits methods only for queries (not mutations)
//
// Spec:
// paths:
//   /users:
//     get:
//       operationId: listUsers
//       responses: &a1
//         "200":
//           description: OK
//           content:
//             application/json:
//               schema:
//                 type: object
//     post:
//       operationId: createUser
//       requestBody:
//         content:
//           application/json:
//             schema:
//               type: object
//       responses:
//         "201":
//           description: Created
//           content:
//             application/json:
//               schema:
//                 type: object
//   /users/{userId}:
//     get:
//       operationId: getUser
//       parameters:
//         - name: userId
//           in: path
//           required: true
//           schema:
//             type: string
//       responses: *a1
//     delete:
//       operationId: deleteUser
//       parameters:
//         - name: userId
//           in: path
//           required: true
//           schema:
//             type: string
//       responses:
//         "204":
//           description: No Content

import { type QueryClient, type SkipToken, queryOptions, type QueryKey, skipToken, mutationOptions } from "@tanstack/react-query";
import type { z } from "zod";
import type { ListUsers_Parameters, ListUsers_Response, CreateUser_Parameters, CreateUser_Response, GetUser_Parameters, GetUser_Response, DeleteUser_Parameters, DeleteUser_Response } from "./schemas.ts";
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
  async deleteUser(parameters: z.output<typeof DeleteUser_Parameters>) {
    const result = await this.#api.deleteUser(parameters).then(getApiResult, getUnexpectedResult);
    if (result.type === "success") return result.data;
    throw result.error;
  }
  deleteUserMutation() {
    return mutationOptions<QuerySuccess<z.output<typeof DeleteUser_Response>>, QueryError<z.output<typeof DeleteUser_Response>>, z.output<typeof DeleteUser_Parameters>>({
      mutationFn: async (parameters: z.output<typeof DeleteUser_Parameters>) => this.deleteUser(parameters)
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
  async getUser(parameters?: Partial<z.output<typeof GetUser_Parameters>>) {
    return await this.#queryClient.invalidateQueries({
      queryKey: ["GetUser", ...(parameters ? [parameters] : [])]
    });
  }
}