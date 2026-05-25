// Test: operations > response with content but no schema falls through (warn)
//
// Spec:
// paths:
//   /raw:
//     get:
//       operationId: raw
//       responses:
//         "200":
//           description: OK
//           content:
//             text/plain: {}

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
export const Raw_Parameters = z.codec(ParametersSchema, z.object({}), {
  decode: notImplemented,
  encode: () => {
    return {
      path: `/raw`,
      method: "GET"
    };
  }
});
export const Raw_Response = z.discriminatedUnion("code", [/*OK*/z.object({
  code: z.literal(200),
  contentType: z.string().optional(),
  response: blobResponseCodec
})]);