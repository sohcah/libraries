// Test: operations > single GET locks in class skeleton + method body shape
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

import { z } from "zod";
import { ListUsers_Parameters, ListUsers_Response } from "./schemas.ts";
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
}