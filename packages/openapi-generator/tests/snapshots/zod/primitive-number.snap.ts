// Test: primitives > primitive number
//
// Spec:
// components:
//   schemas:
//     Thing:
//       type: number

import z from "zod";
export const Thing = z.number();
export type Thing = z.output<typeof Thing>;