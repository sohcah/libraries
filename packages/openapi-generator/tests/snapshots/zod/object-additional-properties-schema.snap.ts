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
export const Thing = z.object({
  id: z.string()
}).catchall(z.number());
export type Thing = z.output<typeof Thing>;