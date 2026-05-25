// Test: operations > non-numeric status code is skipped with a warn
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
//         default:
//           description: Default

import z from "zod";
const ParametersSchema = z.object({
  path: z.string(),
  method: z.string(),
  headers: z.instanceof(Headers).optional(),
  body: z.union([z.string(), z.instanceof(Blob), z.instanceof(FormData), z.instanceof(URLSearchParams)]).optional()
});
const notImplemented = () => {
  throw new Error("Not implemented");
};
const jsonResponseCodec = z.codec(z.instanceof(Response), z.unknown(), {
  decode: async (response, ctx): Promise<unknown> => {
    try {
      return await response.json();
    } catch (error: unknown) {
      ctx.issues.push({
        code: "custom",
        input: response,
        message: (error as Error).message
      });
      return z.NEVER;
    }
  },
  encode: notImplemented
});
export const ListUsers_Parameters = z.codec(ParametersSchema, z.object({}), {
  decode: notImplemented,
  encode: () => {
    return {
      path: `/users`,
      method: "GET"
    };
  }
});
export const ListUsers_Response = z.discriminatedUnion("code", [/*OK*/z.discriminatedUnion("contentType", [z.object({
  code: z.literal(200),
  contentType: z.literal(["application/json"]),
  response: z.pipe(jsonResponseCodec, z.object({}))
})])]);