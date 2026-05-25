// Test: operations > unsupported request body content type warns and falls through
//
// Spec:
// paths:
//   /raw:
//     post:
//       operationId: raw
//       requestBody:
//         content:
//           text/plain:
//             schema:
//               type: string
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
export const Raw_Parameters = z.codec(ParametersSchema, z.object({
  data: z.never()
}), {
  decode: notImplemented,
  encode: () => {
    return {
      path: `/raw`,
      method: "POST"
    };
  }
});
export const Raw_Response = z.discriminatedUnion("code", [/*No Content*/z.object({
  code: z.literal(204),
  contentType: z.string().optional(),
  response: blobResponseCodec
})]);