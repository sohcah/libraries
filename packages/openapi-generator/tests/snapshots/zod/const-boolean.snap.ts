// Test: collections > const boolean literal
//
// Spec:
// components:
//   schemas:
//     Thing:
//       const: true

import z from "zod";
export const Thing = z.literal(true);
export type Thing = z.output<typeof Thing>;