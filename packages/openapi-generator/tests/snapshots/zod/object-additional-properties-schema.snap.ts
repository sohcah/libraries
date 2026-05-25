// Test: objects > additionalProperties as schema
//
// Spec:
// components:
//   schemas:
//     Thing:
//       type: object
//       properties:
//         id:
//           type: string
//       required:
//         - id
//       additionalProperties:
//         type: number

import z from "zod";
export const Thing = z.catchall(z.object({
  id: z.string()
}), z.number());
export type Thing = z.output<typeof Thing>;