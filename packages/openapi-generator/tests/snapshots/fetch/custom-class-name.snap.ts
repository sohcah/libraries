// Test: options > custom className
//
// Spec:
// paths:
//   /ping:
//     get:
//       operationId: ping
//       responses:
//         "200":
//           description: OK
//           content:
//             application/json:
//               schema:
//                 type: object

import { z } from "zod";
import { Ping_Parameters, Ping_Response } from "./schemas.ts";
export class MyHttpClient {
  #fetch;
  constructor(fetch: (path: string, options: {
    method: string;
    headers?: Headers;
    body?: BodyInit;
  }) => Promise<Response>) {
    this.#fetch = fetch;
  }
  async ping(parameters: z.output<typeof Ping_Parameters>) {
    const params = await z.encodeAsync(Ping_Parameters, parameters);
    const response = await this.#fetch(params.path, {
      method: params.method,
      headers: params.headers,
      body: params.body
    });
    const result = await z.parseAsync(Ping_Response, {
      code: response.status,
      contentType: response.headers.get("Content-Type")?.split(";")?.[0],
      response: response
    });
    return result;
  }
}