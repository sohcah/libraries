// Test: objects > additionalProperties: true
//
// Spec:
// components:
//   schemas:
//     Thing:
//       type: object
//       additionalProperties: true

import z from "zod";
export const Thing = z.record(z.string(), z.unknown());
export type Thing = z.output<typeof Thing>;