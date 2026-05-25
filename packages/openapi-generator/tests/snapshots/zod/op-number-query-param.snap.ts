// Test: operations > number query parameter is coerced to string via String()
//
// Spec:
// paths:
//   /items:
//     get:
//       operationId: listItems
//       parameters:
//         - name: limit
//           in: query
//           schema:
//             type: integer
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
  limit: z.int().optional()
}), {
  decode: notImplemented,
  encode: value => {
    const queryParams = new URLSearchParams();
    if (value.limit !== undefined) queryParams.append("limit", String(value.limit));
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