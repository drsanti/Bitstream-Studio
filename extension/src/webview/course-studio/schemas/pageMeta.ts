import { z } from "zod";
import { linkHealthPolicySchema } from "./linkHealth";

export const telemetryPreferenceSchema = z.enum(["auto", "uart", "simulator"]);

export type TelemetryPreferenceV1 = z.infer<typeof telemetryPreferenceSchema>;

export const pageMetaSchema = z.object({
  telemetryPreference: telemetryPreferenceSchema.default("auto"),
  staleMs: z.number().int().positive().optional(),
  defaultLinkHealth: linkHealthPolicySchema.optional(),
});

export type PageMetaV1 = z.infer<typeof pageMetaSchema>;

export const DEFAULT_PAGE_META: PageMetaV1 = {
  telemetryPreference: "auto",
};
