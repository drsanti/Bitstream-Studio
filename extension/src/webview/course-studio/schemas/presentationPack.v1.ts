import { z } from "zod";

export const presentationPackV1Schema = z.object({
  version: z.literal(1),
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  createdAt: z.string().datetime(),
  /** When set, names the bundled `courses/*.course.v1.json` manifest id. */
  courseId: z.string().min(1).optional(),
  /** Relative paths inside the pack (e.g. pages/foo.page.v1.json) → UTF-8 file body. */
  files: z.record(z.string(), z.string()),
});

export type PresentationPackV1 = z.infer<typeof presentationPackV1Schema>;

export function parsePresentationPackV1(raw: unknown): PresentationPackV1 {
  return presentationPackV1Schema.parse(raw);
}

export const PRESENTATION_PACK_EXTENSION = ".trn-presentation-pack.json";
