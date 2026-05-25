// Test: operations > multipart/form-data with an object schema but no properties produces an empty encode
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
//               type: object
//       responses:
//         "204":
//           description: No Content

import z from "zod";
const notImplemented = () => {
  throw new Error("Not implemented");
};
const ParametersSchema = z.object({
  path: z.string(),
  method: z.string(),
  headers: z.instanceof(Headers).optional(),
  body: z.union([z.string(), z.instanceof(Blob), z.instanceof(FormData), z.instanceof(URLSearchParams)]).optional()
});
const blobResponseCodec = z.codec(z.instanceof(Response), z.instanceof(Blob), {
  decode: async value => {
    return await value.blob();
  },
  encode: notImplemented
});
export const Upload_Parameters = z.codec(ParametersSchema, z.object({
  data: z.codec(z.object({
    content: z.instanceof(FormData)
  }), z.object({}), {
    decode: notImplemented,
    encode: value => {
      const formData = new FormData();
      return {
        content: formData
      };
    }
  })
}), {
  decode: notImplemented,
  encode: value => {
    return {
      path: `/upload`,
      method: "POST",
      body: value.data.content
    };
  }
});
export const Upload_Response = z.discriminatedUnion("code", [/*No Content*/z.object({
  code: z.literal(204),
  contentType: z.string().optional(),
  response: blobResponseCodec
})]);