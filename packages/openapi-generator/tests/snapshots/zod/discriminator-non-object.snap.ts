// Test: composition > discriminator falls back to a plain union when mapped schemas are non-objects
//
// Spec:
// components:
//   schemas:
//     Tag:
//       type: string
//     Wrapper:
//       type: object
//       oneOf:
//         - $ref: "#/components/schemas/Tag"
//       discriminator:
//         propertyName: kind
//         mapping:
//           foo: "#/components/schemas/Tag"

import z from "zod";
export const Tag = z.string();
export type Tag = z.output<typeof Tag>;
export const Wrapper = z.union([z.intersection(Tag, z.object({
  kind: z.literal("foo")
}))]);
export type Wrapper = z.output<typeof Wrapper>;