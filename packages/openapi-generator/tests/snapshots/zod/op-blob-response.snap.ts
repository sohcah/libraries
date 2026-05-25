// Test: operations > blob response (application/octet-stream)
//
// Spec:
// paths:
//   /download:
//     get:
//       operationId: download
//       responses:
//         "200":
//           description: OK
//           content:
//             application/octet-stream:
//               schema:
//                 type: string
//                 format: binary

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
export const Download_Parameters = z.codec(ParametersSchema, z.object({}), {
  decode: notImplemented,
  encode: () => {
    return {
      path: `/download`,
      method: "GET"
    };
  }
});
export const Download_Response = z.discriminatedUnion("code", [/*OK*/z.discriminatedUnion("contentType", [z.object({
  code: z.literal(200),
  contentType: z.literal(["application/octet-stream"]),
  response: z.pipe(jsonResponseCodec, z.instanceof(Blob))
})])]);