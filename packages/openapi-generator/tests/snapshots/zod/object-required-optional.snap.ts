// Test: objects > required and optional properties
//
// Spec:
// components:
//   schemas:
//     Thing:
//       type: object
//       properties:
//         id:
//           type: integer
//         name:
//           type: string
//       required:
//         - id

import z from "zod";
export const Thing = z.object({
  id: z.int(),
  name: z.string().optional()
});
export type Thing = z.output<typeof Thing>;