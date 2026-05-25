// Test: operations > multiple json bodies share the json-content encode helper
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
//       responses:
//         "204":
//           description: No Content
//   /groups:
//     post:
//       operationId: createGroup
//       requestBody:
//         content:
//           application/json:
//             schema:
//               type: object
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
export const CreateUser_Parameters = z.codec(ParametersSchema, z.object({
  data: z.codec(z.object({
    contentType: z.string(),
    content: z.string()
  }), z.object({}), {
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
export const CreateUser_Response = z.discriminatedUnion("code", [/*No Content*/z.object({
  code: z.literal(204),
  contentType: z.string().optional(),
  response: blobResponseCodec
})]);
export const CreateGroup_Parameters = z.codec(ParametersSchema, z.object({
  data: z.codec(z.object({
    contentType: z.string(),
    content: z.string()
  }), z.object({}), {
    decode: notImplemented,
    encode: jsonContentEncode
  })
}), {
  decode: notImplemented,
  encode: value => {
    const headers = new Headers();
    headers.append("Content-Type", value.data.contentType);
    return {
      path: `/groups`,
      method: "POST",
      headers: headers,
      body: value.data.content
    };
  }
});
export const CreateGroup_Response = z.discriminatedUnion("code", [/*No Content*/z.object({
  code: z.literal(204),
  contentType: z.string().optional(),
  response: blobResponseCodec
})]);