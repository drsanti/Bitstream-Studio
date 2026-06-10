import { z } from "zod";
import { cardBlockColorsSchema } from "./cardBlockColors";
import { dashboardWidgetBlockColorsSchema } from "./dashboardWidgetBlockColors";
import { sensorTelemetryCardBlockColorsSchema } from "./sensorTelemetryCardBlockColors";
import { linkHealthPolicySchema } from "./linkHealth";
import { markdownBlockColorsSchema } from "./markdownBlockColors";

export const telemetryPreferenceSchema = z.enum(["auto", "uart", "simulator"]);

export type TelemetryPreferenceV1 = z.infer<typeof telemetryPreferenceSchema>;

export const pageMetaSchema = z.object({
  telemetryPreference: telemetryPreferenceSchema.default("auto"),
  staleMs: z.number().int().positive().optional(),
  defaultLinkHealth: linkHealthPolicySchema.optional(),
  /** Page-wide card color defaults (blocks inherit unset fields). */
  cardColors: cardBlockColorsSchema.optional(),
  markdownColors: markdownBlockColorsSchema.optional(),
  /** Page-wide dashboard widget container defaults (blocks inherit unset fields). */
  dashboardWidgetColors: dashboardWidgetBlockColorsSchema.optional(),
  /** Page-wide sensor telemetry card chrome defaults (blocks inherit unset color fields). */
  sensorTelemetryCardColors: sensorTelemetryCardBlockColorsSchema.optional(),
  cardThemePresetId: z.string().min(1).optional(),
  markdownThemePresetId: z.string().min(1).optional(),
});

export type PageMetaV1 = z.infer<typeof pageMetaSchema>;

export const DEFAULT_PAGE_META: PageMetaV1 = {
  telemetryPreference: "auto",
};
