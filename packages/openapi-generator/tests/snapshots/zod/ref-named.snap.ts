// Test: $ref handling > referenced schemas are emitted as named consts
//
// Spec:
// components:
//   schemas:
//     User:
//       type: object
//       properties:
//         id:
//           type: string
//       required:
//         - id
//     UserList:
//       type: array
//       items:
//         $ref: "#/components/schemas/User"

import z from "zod";
export const User = z.object({
  id: z.string()
});
export type User = z.output<typeof User>;
export const UserList = z.array(User);
export type UserList = z.output<typeof UserList>;