// Test: primitives > primitive string
//
// Spec:
// components:
//   schemas:
//     Thing:
//       type: string

import z from "zod";
export const Thing = z.string();
export type Thing = z.output<typeof Thing>;