// Test: composition > discriminator with x-sohcah-extensible-union: true emits a "fall-through" branch
//
// Spec:
// components:
//   schemas:
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
//     Animal:
//       type: object
//       x-sohcah-extensible-union: true
//       oneOf:
//         - $ref: "#/components/schemas/Cat"
//         - $ref: "#/components/schemas/Dog"
//       discriminator:
//         propertyName: kind
//         mapping:
//           cat: "#/components/schemas/Cat"
//           dog: "#/components/schemas/Dog"

import z from "zod";
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
export const Animal = z.union([z.discriminatedUnion("kind", [Cat.extend({
  kind: z.literal("cat")
}), Dog.extend({
  kind: z.literal("dog")
})]), z.object({
  kind: z.string().refine(type => type !== "cat" && type !== "dog").transform(() => "unknown" as const)
})]);
export type Animal = z.output<typeof Animal>;