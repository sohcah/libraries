// Test: operations > operation without operationId sanitizes invalid identifier characters in path
//
// Spec:
// paths:
//   /users/{id}:
//     get:
//       parameters:
//         - name: id
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
export const GetUsers__id___Parameters = z.codec(ParametersSchema, z.object({
  id: z.string()
}), {
  decode: notImplemented,
  encode: value => {
    return {
      path: `/users/${value.id}`,
      method: "GET"
    };
  }
});
export const GetUsers__id___Response = z.discriminatedUnion("code", [/*OK*/z.discriminatedUnion("contentType", [z.object({
  code: z.literal(200),
  contentType: z.literal(["application/json"]),
  response: z.pipe(jsonResponseCodec, z.object({}))
})])]);