// Test: collections > array of strings
//
// Spec:
// components:
//   schemas:
//     Thing:
//       type: array
//       items:
//         type: string

import z from "zod";
export const Thing = z.array(z.string());
export type Thing = z.output<typeof Thing>;