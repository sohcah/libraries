// Test: composition > nullable via union with null collapses to .nullable()
//
// Spec:
// components:
//   schemas:
//     Thing:
//       oneOf:
//         - type: string
//         - type: "null"

import z from "zod";
export const Thing = z.string().nullable();
export type Thing = z.output<typeof Thing>;