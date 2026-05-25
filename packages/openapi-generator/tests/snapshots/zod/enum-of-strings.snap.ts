// Test: collections > enum of strings
//
// Spec:
// components:
//   schemas:
//     Thing:
//       type: string
//       enum:
//         - a
//         - b
//         - c

import z from "zod";
export const Thing = z.enum(["a", "b", "c"]);
export type Thing = z.output<typeof Thing>;