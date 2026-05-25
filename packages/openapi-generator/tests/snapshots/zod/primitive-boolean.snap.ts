// Test: primitives > primitive boolean
//
// Spec:
// components:
//   schemas:
//     Thing:
//       type: boolean

import z from "zod";
export const Thing = z.boolean();
export type Thing = z.output<typeof Thing>;