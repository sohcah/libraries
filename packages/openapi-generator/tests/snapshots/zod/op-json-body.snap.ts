// Test: operations > application/json request body
//
// Spec:
// paths:
//   /users:
//     post:
//       operationId: createUser
//       requestBody:
//         content:
//           application/json:
//             schema:
//               type: object
//               properties:
//                 name:
//                   type: string
//               required:
//                 - name
//       responses:
//         "201":
//           description: Created
//           content:
//             application/json:
//               schema:
//                 type: object

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
export const CreateUser_Parameters = z.codec(ParametersSchema, z.object({
  data: z.codec(z.object({
    contentType: z.string(),
    content: z.string()
  }), z.object({
    name: z.string()
  }), {
    decode: notImplemented,
    encode: jsonContentEncode
  })
}), {
  decode: notImplemented,
  encode: value => {
    const headers = new Headers();
    headers.append("Content-Type", value.data.contentType);
    return {
      path: `/users`,
      method: "POST",
      headers: headers,
      body: value.data.content
    };
  }
});
export const CreateUser_Response = z.discriminatedUnion("code", [/*Created*/z.discriminatedUnion("contentType", [z.object({
  code: z.literal(201),
  contentType: z.literal(["application/json"]),
  response: z.pipe(jsonResponseCodec, z.object({}))
})])]);