import { z } from "zod";

export const dataTypeColorsSchema = z.object({
  configVersion: z.number().int().positive(),
  updatedAt: z.string().datetime(),
  payload: z.object({
    number: z.string().min(1),
    boolean: z.string().min(1),
    string: z.string().min(1),
    event: z.string().min(1),
    vector3: z.string().min(1),
    quaternion: z.string().min(1),
    environment: z.string().min(1),
    camera: z.string().min(1).default("#93C5FD"),
    glbAnimation: z.string().min(1).default("#FBBF24"),
  }),
});
