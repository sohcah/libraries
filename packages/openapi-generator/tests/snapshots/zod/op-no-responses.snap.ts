// Test: operations > operation without any responses falls back to a blob-with-any-code schema
//
// Spec:
// paths:
//   /ping:
//     get:
//       operationId: ping

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
export const Ping_Parameters = z.codec(ParametersSchema, z.object({}), {
  decode: notImplemented,
  encode: () => {
    return {
      path: `/ping`,
      method: "GET"
    };
  }
});
export const Ping_Response = z.object({
  code: z.number(),
  contentType: z.string().optional(),
  response: blobResponseCodec
});