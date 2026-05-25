// Test: composition > oneOf produces a union
//
// Spec:
// components:
//   schemas:
//     Thing:
//       oneOf:
//         - type: string
//         - type: number

import z from "zod";
export const Thing = z.union([z.string(), z.number()]);
export type Thing = z.output<typeof Thing>;