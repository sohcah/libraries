// Test: strings > binary string emits Blob codec
//
// Spec:
// components:
//   schemas:
//     Thing:
//       type: string
//       format: binary

import z from "zod";
export const Thing = z.instanceof(Blob);
export type Thing = z.output<typeof Thing>;