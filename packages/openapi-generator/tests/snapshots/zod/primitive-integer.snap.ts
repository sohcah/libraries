// Test: primitives > primitive integer
//
// Spec:
// components:
//   schemas:
//     Thing:
//       type: integer

import z from "zod";
export const Thing = z.int();
export type Thing = z.output<typeof Thing>;