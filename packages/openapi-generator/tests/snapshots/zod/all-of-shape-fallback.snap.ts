// Test: composition > allOf where the trailing schema is a $ref-to-object uses .extend(<ref>.shape)
//
// Spec:
// components:
//   schemas:
//     Base:
//       type: object
//       properties:
//         id:
//           type: string
//       required:
//         - id
//     Other:
//       type: object
//       properties:
//         name:
//           type: string
//       required:
//         - name
//     Combined:
//       allOf:
//         - $ref: "#/components/schemas/Base"
//         - $ref: "#/components/schemas/Other"

import z from "zod";
export const Base = z.object({
  id: z.string()
});
export type Base = z.output<typeof Base>;
export const Other = z.object({
  name: z.string()
});
export type Other = z.output<typeof Other>;
export const Combined = Base.extend(Other.shape);
export type Combined = z.output<typeof Combined>;