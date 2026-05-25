// Test: extensions > x-sohcah-brand-id emits a branded schema entry
//
// Spec:
// components:
//   schemas:
//     Thing:
//       type: string
//       x-sohcah-brand-id: UserId

import z from "zod";
export const UserId = z.string().brand<"UserId", "inout">();
export type UserId = z.output<typeof UserId>;
export const Thing = UserId;
export type Thing = z.output<typeof Thing>;