// Test: primitives > primitive null
//
// Spec:
// components:
//   schemas:
//     Thing:
//       type: "null"

import z from "zod";
export const Thing = z.null();
export type Thing = z.output<typeof Thing>;