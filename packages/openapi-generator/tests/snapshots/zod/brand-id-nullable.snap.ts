// Test: extensions > x-sohcah-brand-id paired with a nullable type-array still produces the brand
//
// Spec:
// components:
//   schemas:
//     Thing:
//       type:
//         - string
//         - "null"
//       x-sohcah-brand-id: UserId

import z from "zod";
export const UserId = z.string().brand<"UserId", "inout">();
export type UserId = z.output<typeof UserId>;
export const Thing = UserId.nullable();
export type Thing = z.output<typeof Thing>;