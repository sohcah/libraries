// Test: collections > const literal
//
// Spec:
// components:
//   schemas:
//     Thing:
//       const: fixed

import z from "zod";
export const Thing = z.literal("fixed");
export type Thing = z.output<typeof Thing>;