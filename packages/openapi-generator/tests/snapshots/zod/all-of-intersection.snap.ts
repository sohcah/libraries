// Test: composition > allOf of two non-object schemas falls back to intersection
//
// Spec:
// components:
//   schemas:
//     Thing:
//       allOf:
//         - type: string
//         - type: string

import z from "zod";
export const Thing = z.intersection(z.string(), z.string());
export type Thing = z.output<typeof Thing>;