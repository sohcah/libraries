// Test: operations > multiple request body content types produce a union codec
//
// Spec:
// paths:
//   /upload:
//     post:
//       operationId: upload
//       requestBody:
//         content:
//           application/json:
//             schema:
//               type: object
//               properties:
//                 name:
//                   type: string
//           multipart/form-data:
//             schema:
//               type: object
//               properties:
//                 file:
//                   type: string
//                   format: binary
//               required:
//                 - file
//       responses:
//         "204":
//           description: No Content

import z from "zod";
const notImplemented = () => {
  throw new Error("Not implemented");
};
const jsonContentEncode = (value: unknown) => {
  return {
    contentType: "application/json",
    content: JSON.stringify(value)
  };
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
  data: z.union(z.codec(z.object({
    contentType: z.string(),
    content: z.string()
  }), z.object({
    name: z.string().optional()
  }), {
    decode: notImplemented,
    encode: jsonContentEncode
  }), z.codec(z.object({
    content: z.instanceof(FormData)
  }), z.object({
    file: z.instanceof(Blob)
  }), {
    decode: notImplemented,
    encode: value => {
      const formData = new FormData();
      formData.append("file", value.file);
      return {
        content: formData
      };
    }
  }))
}), {
  decode: notImplemented,
  encode: value => {
    const headers = new Headers();
    if (value.data.contentType !== undefined) headers.append("Content-Type", value.data.contentType);
    return {
      path: `/upload`,
      method: "POST",
      headers: headers,
      body: value.data.content
    };
  }
});
export const Upload_Response = z.discriminatedUnion("code", [/*No Content*/z.object({
  code: z.literal(204),
  contentType: z.string().optional(),
  response: blobResponseCodec
})]);