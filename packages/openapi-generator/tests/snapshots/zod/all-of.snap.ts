// Test: composition > allOf merges schemas
//
// Spec:
// components:
//   schemas:
//     Base:
//       type: object
//       properties:
//         id:
//           type: string
//       required:
//         - id
//     Extended:
//       allOf:
//         - $ref: "#/components/schemas/Base"
//         - type: object
//           properties:
//             name:
//               type: string
//           required:
//             - name

import z from "zod";
export const Base = z.object({
  id: z.string()
});
export type Base = z.output<typeof Base>;
export const Extended = Base.extend({
  name: z.string()
});
export type Extended = z.output<typeof Extended>;