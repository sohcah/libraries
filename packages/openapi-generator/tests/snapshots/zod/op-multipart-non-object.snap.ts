// Test: operations > multipart/form-data request body with non-object schema warns and skips
//
// Spec:
// paths:
//   /upload:
//     post:
//       operationId: upload
//       requestBody:
//         content:
//           multipart/form-data:
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
export const Upload_Parameters = z.codec(ParametersSchema, z.object({
  data: z.never()
}), {
  decode: notImplemented,
  encode: () => {
    return {
      path: `/upload`,
      method: "POST"
    };
  }
});
export const Upload_Response = z.discriminatedUnion("code", [/*No Content*/z.object({
  code: z.literal(204),
  contentType: z.string().optional(),
  response: blobResponseCodec
})]);