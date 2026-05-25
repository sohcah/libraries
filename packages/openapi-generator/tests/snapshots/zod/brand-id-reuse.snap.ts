// Test: extensions > multiple schemas with the same x-sohcah-brand-id reuse the existing brand entry
//
// Spec:
// components:
//   schemas:
//     PrimaryId:
//       type: string
//       x-sohcah-brand-id: UserId
//     SecondaryId:
//       type: string
//       x-sohcah-brand-id: UserId

import z from "zod";
export const UserId = z.string().brand<"UserId", "inout">();
export type UserId = z.output<typeof UserId>;
export const PrimaryId = UserId;
export type PrimaryId = z.output<typeof PrimaryId>;
export const SecondaryId = UserId;
export type SecondaryId = z.output<typeof SecondaryId>;