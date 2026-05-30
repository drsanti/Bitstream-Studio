import { z } from "zod";

export const themeConfigSchema = z.object({
  configVersion: z.number().int().positive(),
  updatedAt: z.string().datetime(),
  payload: z.object({
    color: z.object({
      background: z.object({
        canvas: z.string().min(1),
        panel: z.string().min(1),
      }),
      border: z.object({
        default: z.string().min(1),
      }),
      text: z.object({
        primary: z.string().min(1),
        secondary: z.string().min(1),
      }),
      status: z.object({
        ok: z.string().min(1),
        warning: z.string().min(1),
        error: z.string().min(1),
        info: z.string().min(1),
      }),
    }),
  }),
});
