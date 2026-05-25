// Test: operations > multiple operations accumulate as methods on the same class
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
//       responses: *a1
//   /users/{id}:
//     get:
//       operationId: getUser
//       parameters:
//         - name: id
//           in: path
//           required: true
//           schema:
//             type: string
//       responses: *a1

import { z } from "zod";
import { ListUsers_Parameters, ListUsers_Response, CreateUser_Parameters, CreateUser_Response, GetUser_Parameters, GetUser_Response } from "./schemas.ts";
export class FetchApi {
  #fetch;
  constructor(fetch: (path: string, options: {
    method: string;
    headers?: Headers;
    body?: BodyInit;
  }) => Promise<Response>) {
    this.#fetch = fetch;
  }
  async listUsers(parameters: z.output<typeof ListUsers_Parameters>) {
    const params = await z.encodeAsync(ListUsers_Parameters, parameters);
    const response = await this.#fetch(params.path, {
      method: params.method,
      headers: params.headers,
      body: params.body
    });
    const result = await z.parseAsync(ListUsers_Response, {
      code: response.status,
      contentType: response.headers.get("Content-Type")?.split(";")?.[0],
      response: response
    });
    return result;
  }
  async createUser(parameters: z.output<typeof CreateUser_Parameters>) {
    const params = await z.encodeAsync(CreateUser_Parameters, parameters);
    const response = await this.#fetch(params.path, {
      method: params.method,
      headers: params.headers,
      body: params.body
    });
    const result = await z.parseAsync(CreateUser_Response, {
      code: response.status,
      contentType: response.headers.get("Content-Type")?.split(";")?.[0],
      response: response
    });
    return result;
  }
  async getUser(parameters: z.output<typeof GetUser_Parameters>) {
    const params = await z.encodeAsync(GetUser_Parameters, parameters);
    const response = await this.#fetch(params.path, {
      method: params.method,
      headers: params.headers,
      body: params.body
    });
    const result = await z.parseAsync(GetUser_Response, {
      code: response.status,
      contentType: response.headers.get("Content-Type")?.split(";")?.[0],
      response: response
    });
    return result;
  }
}