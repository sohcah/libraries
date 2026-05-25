// Test: operations > query parameter with unsupported (object) type warns
//
// Spec:
// paths:
//   /items:
//     get:
//       operationId: listItems
//       parameters:
//         - name: filter
//           in: query
//           schema:
//             type: object
//             properties:
//               x:
//                 type: string
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
export const ListItems_Parameters = z.codec(ParametersSchema, z.object({
  filter: z.object({
    x: z.string().optional()
  }).optional()
}), {
  decode: notImplemented,
  encode: value => {
    return {
      path: `/items`,
      method: "GET"
    };
  }
});
export const ListItems_Response = z.discriminatedUnion("code", [/*OK*/z.discriminatedUnion("contentType", [z.object({
  code: z.literal(200),
  contentType: z.literal(["application/json"]),
  response: z.pipe(jsonResponseCodec, z.object({}))
})])]);