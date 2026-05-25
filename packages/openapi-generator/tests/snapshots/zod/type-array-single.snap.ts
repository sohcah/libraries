// Test: collections > type as array with a single entry collapses to that entry's schema
//
// Spec:
// components:
//   schemas:
//     Thing:
//       type:
//         - string

import z from "zod";
export const Thing = z.string();
export type Thing = z.output<typeof Thing>;