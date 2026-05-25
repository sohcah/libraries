// Test: collections > enum of numbers and booleans renders numeric/boolean literals
//
// Spec:
// components:
//   schemas:
//     Thing:
//       enum:
//         - 1
//         - 2
//         - true
//         - false

import z from "zod";
export const Thing = z.literal([1, 2, true, false]);
export type Thing = z.output<typeof Thing>;