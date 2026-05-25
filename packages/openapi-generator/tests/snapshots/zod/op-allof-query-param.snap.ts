// Test: operations > query parameter via single-element allOf
//
// Spec:
// paths:
//   /items:
//     get:
//       operationId: listItems
//       parameters:
//         - name: id
//           in: query
//           schema:
//             allOf:
//               - type: string
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
  id: z.string().optional()
}), {
  decode: notImplemented,
  encode: value => {
    const queryParams = new URLSearchParams();
    if (value.id !== undefined) queryParams.append("id", value.id);
    return {
      path: `/items?${queryParams}`,
      method: "GET"
    };
  }
});
export const ListItems_Response = z.discriminatedUnion("code", [/*OK*/z.discriminatedUnion("contentType", [z.object({
  code: z.literal(200),
  contentType: z.literal(["application/json"]),
  response: z.pipe(jsonResponseCodec, z.object({}))
})])]);