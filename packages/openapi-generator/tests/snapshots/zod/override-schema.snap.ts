// Test: options > overrideSchema redirects a schema to an external schema
//
// Spec:
// components:
//   schemas:
//     Thing:
//       type: string
//       format: uuid

import z from "zod";
import { uuidSchema } from "./custom.ts";
export const Thing = uuidSchema();
export type Thing = z.output<typeof Thing>;