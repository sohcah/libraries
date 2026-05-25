// Test: operations > array query parameter with non-typed items warns and skips
//
// Spec:
// paths:
//   /items:
//     get:
//       operationId: listItems
//       parameters:
//         - name: tags
//           in: query
//           schema:
//             type: array
//             items:
//               const: x
//       responses:
//         "204":
//           description: No Content

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
const blobResponseCodec = z.codec(z.instanceof(Response), z.instanceof(Blob), {
  decode: async value => {
    return await value.blob();
  },
  encode: notImplemented
});
export const ListItems_Parameters = z.codec(ParametersSchema, z.object({
  tags: z.array(z.literal("x")).optional()
}), {
  decode: notImplemented,
  encode: value => {
    return {
      path: `/items`,
      method: "GET"
    };
  }
});
export const ListItems_Response = z.discriminatedUnion("code", [/*No Content*/z.object({
  code: z.literal(204),
  contentType: z.string().optional(),
  response: blobResponseCodec
})]);