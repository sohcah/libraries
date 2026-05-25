// Test: options > includeTypeAnnotations: true emits type annotations on schema consts
//
// Spec:
// components:
//   schemas:
//     Thing:
//       type: string

import z from "zod";
export const Thing: z.Schema<string, string> = z.string();
export type Thing = z.output<typeof Thing>;