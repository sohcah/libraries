// Test: composition > allOf containing a discriminator emits a separate _Base schema
//
// Spec:
// components:
//   schemas:
//     NamedPet:
//       allOf:
//         - $ref: "#/components/schemas/Pet"
//         - type: object
//           properties:
//             name:
//               type: string
//           required:
//             - name
//     Pet:
//       type: object
//       oneOf:
//         - $ref: "#/components/schemas/Cat"
//         - $ref: "#/components/schemas/Dog"
//       discriminator:
//         propertyName: kind
//         mapping:
//           cat: "#/components/schemas/Cat"
//           dog: "#/components/schemas/Dog"
//       properties:
//         kind:
//           type: string
//       required:
//         - kind
//     Cat:
//       type: object
//       properties:
//         kind:
//           type: string
//         meow:
//           type: boolean
//       required:
//         - kind
//         - meow
//     Dog:
//       type: object
//       properties:
//         kind:
//           type: string
//         bark:
//           type: boolean
//       required:
//         - kind
//         - bark

import z from "zod";
export const Pet_Base = z.object({
  kind: z.string()
});
export type Pet_Base = z.output<typeof Pet_Base>;
export const NamedPet = Pet_Base.extend({
  name: z.string()
});
export type NamedPet = z.output<typeof NamedPet>;
export const Cat = z.object({
  kind: z.string(),
  meow: z.boolean()
});
export type Cat = z.output<typeof Cat>;
export const Dog = z.object({
  kind: z.string(),
  bark: z.boolean()
});
export type Dog = z.output<typeof Dog>;
export const Pet = z.discriminatedUnion("kind", [Cat.extend({
  kind: z.literal("cat")
}), Dog.extend({
  kind: z.literal("dog")
})]);
export type Pet = z.output<typeof Pet>;