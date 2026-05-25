// Test: strings > contentMediaType emits Blob codec
//
// Spec:
// components:
//   schemas:
//     Thing:
//       type: string
//       contentMediaType: image/png

import z from "zod";
export const Thing = z.instanceof(Blob);
export type Thing = z.output<typeof Thing>;