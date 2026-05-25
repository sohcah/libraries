// Test: collections > type as array (e.g. ['string', 'null'])
//
// Spec:
// components:
//   schemas:
//     Thing:
//       type:
//         - string
//         - "null"

import z from "zod";
export const Thing = z.string().nullable();
export type Thing = z.output<typeof Thing>;