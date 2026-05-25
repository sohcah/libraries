// Test: options > overrideFormats redirects a format to an external schema
//
// Spec:
// components:
//   schemas:
//     Thing:
//       type: string
//       format: date-time

import z from "zod";
import { dateTimeSchema } from "./custom.ts";
export const Thing = dateTimeSchema();
export type Thing = z.output<typeof Thing>;