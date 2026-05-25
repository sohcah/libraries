// Test: operations > operation without any responses still emits a discriminated union shell
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
export const Ping_Parameters = z.codec(ParametersSchema, z.object({}), {
  decode: notImplemented,
  encode: () => {
    return {
      path: `/ping`,
      method: "GET"
    };
  }
});
export const Ping_Response = z.discriminatedUnion("code", []);