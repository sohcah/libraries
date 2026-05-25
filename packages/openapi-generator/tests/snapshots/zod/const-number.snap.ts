// Test: collections > const numeric literal
//
// Spec:
// components:
//   schemas:
//     Thing:
//       const: 42

import z from "zod";
export const Thing = z.literal(42);
export type Thing = z.output<typeof Thing>;