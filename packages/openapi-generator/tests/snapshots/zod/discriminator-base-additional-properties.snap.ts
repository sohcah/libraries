// Test: composition > discriminator on an object with additionalProperties still emits a _Base entry
//
// Spec:
// components:
//   schemas:
//     NamedPetWithMeta:
//       allOf:
//         - $ref: "#/components/schemas/PetWithMeta"
//         - type: object
//           properties:
//             name:
//               type: string
//           required:
//             - name
//     PetWithMeta:
//       type: object
//       additionalProperties:
//         type: string
//       discriminator:
//         propertyName: kind
//         mapping:
//           cat: "#/components/schemas/Cat"
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

import z from "zod";
export const PetWithMeta_Base = z.record(z.string(), z.string());
export type PetWithMeta_Base = z.output<typeof PetWithMeta_Base>;
export const NamedPetWithMeta = z.intersection(PetWithMeta_Base, z.object({
  name: z.string()
}));
export type NamedPetWithMeta = z.output<typeof NamedPetWithMeta>;
export const Cat = z.object({
  kind: z.string(),
  meow: z.boolean()
});
export type Cat = z.output<typeof Cat>;
export const PetWithMeta = z.discriminatedUnion("kind", [Cat.extend({
  kind: z.literal("cat")
})]);
export type PetWithMeta = z.output<typeof PetWithMeta>;