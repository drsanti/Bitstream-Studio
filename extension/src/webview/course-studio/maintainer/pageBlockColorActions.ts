import type { CardBlockColors } from "../schemas/cardBlockColors";
import { stripEmptyCardBlockColors } from "../schemas/cardBlockColors";
import type { DashboardWidgetBlockColors } from "../schemas/dashboardWidgetBlockColors";
import { stripEmptyDashboardWidgetBlockColors } from "../schemas/dashboardWidgetBlockColors";
import type { SensorTelemetryCardBlockColors } from "../schemas/sensorTelemetryCardBlockColors";
import { stripEmptySensorTelemetryCardBlockColors } from "../schemas/sensorTelemetryCardBlockColors";
import type { MarkdownBlockColors } from "../schemas/markdownBlockColors";
import { stripEmptyMarkdownBlockColors } from "../schemas/markdownBlockColors";
import type { PageBlockV1, PageV1 } from "../schemas/page.v1";
import type { PageMetaV1 } from "../schemas/pageMeta";

export type BlockColorBulkApplyMode = "replace" | "merge";

function mergeColorRecords<T extends Record<string, string | undefined>>(
  base: T | undefined,
  overlay: T | undefined,
): T | undefined {
  if (overlay == null) {
    return base;
  }
  const next = { ...(base ?? {}), ...overlay } as T;
  return next;
}

export function applyCardColorsToPageBlocks(
  page: PageV1,
  colors: CardBlockColors | undefined,
  mode: BlockColorBulkApplyMode,
): PageBlockV1[] {
  const normalized = stripEmptyCardBlockColors(colors);
  return page.blocks.map((block) => {
    if (block.kind !== "card") {
      return block;
    }
    if (normalized == null) {
      return mode === "replace" ? { ...block, colors: undefined } : block;
    }
    if (mode === "merge") {
      return {
        ...block,
        colors: stripEmptyCardBlockColors(mergeColorRecords(block.colors, normalized)),
      };
    }
    return { ...block, colors: structuredClone(normalized) };
  });
}

export function applyMarkdownColorsToPageBlocks(
  page: PageV1,
  colors: MarkdownBlockColors | undefined,
  mode: BlockColorBulkApplyMode,
): PageBlockV1[] {
  const normalized = stripEmptyMarkdownBlockColors(colors);
  return page.blocks.map((block) => {
    if (block.kind !== "markdown") {
      return block;
    }
    if (normalized == null) {
      return mode === "replace" ? { ...block, colors: undefined } : block;
    }
    if (mode === "merge") {
      return {
        ...block,
        colors: stripEmptyMarkdownBlockColors(mergeColorRecords(block.colors, normalized)),
      };
    }
    return { ...block, colors: structuredClone(normalized) };
  });
}

export function applyDashboardWidgetColorsToPageBlocks(
  page: PageV1,
  colors: DashboardWidgetBlockColors | undefined,
  mode: BlockColorBulkApplyMode,
): PageBlockV1[] {
  const normalized = stripEmptyDashboardWidgetBlockColors(colors);
  return page.blocks.map((block) => {
    if (block.kind !== "dashboard-widget") {
      return block;
    }
    if (normalized == null) {
      return mode === "replace" ? { ...block, colors: undefined } : block;
    }
    if (mode === "merge") {
      return {
        ...block,
        colors: stripEmptyDashboardWidgetBlockColors(
          mergeColorRecords(block.colors, normalized),
        ),
      };
    }
    return { ...block, colors: structuredClone(normalized) };
  });
}

function mergeSensorTelemetryCardBlockColors(
  blockAppearanceColors: SensorTelemetryCardBlockColors | undefined,
  overlay: SensorTelemetryCardBlockColors | undefined,
): SensorTelemetryCardBlockColors | undefined {
  return stripEmptySensorTelemetryCardBlockColors(
    mergeColorRecords(blockAppearanceColors, overlay),
  );
}

export function applySensorTelemetryCardColorsToPageBlocks(
  page: PageV1,
  colors: SensorTelemetryCardBlockColors | undefined,
  mode: BlockColorBulkApplyMode,
): PageBlockV1[] {
  const normalized = stripEmptySensorTelemetryCardBlockColors(colors);
  return page.blocks.map((block) => {
    if (block.kind !== "sensor-telemetry-card") {
      return block;
    }
    if (normalized == null) {
      if (mode !== "replace") {
        return block;
      }
      if (block.appearance?.colors == null) {
        return block;
      }
      const nextAppearance = { ...block.appearance };
      delete nextAppearance.colors;
      return {
        ...block,
        appearance: Object.keys(nextAppearance).length > 0 ? nextAppearance : undefined,
      };
    }
    if (mode === "merge") {
      return {
        ...block,
        appearance: {
          ...(block.appearance ?? {}),
          colors: mergeSensorTelemetryCardBlockColors(block.appearance?.colors, normalized),
        },
      };
    }
    return {
      ...block,
      appearance: {
        ...(block.appearance ?? {}),
        colors: structuredClone(normalized),
      },
    };
  });
}

export function patchPageMetaDashboardWidgetColors(
  meta: PageMetaV1 | undefined,
  colors: DashboardWidgetBlockColors | undefined,
): PageMetaV1 {
  const next = { ...(meta ?? {}) };
  const normalized = stripEmptyDashboardWidgetBlockColors(colors);
  if (normalized == null) {
    delete next.dashboardWidgetColors;
  } else {
    next.dashboardWidgetColors = normalized;
  }
  return next;
}

export function patchPageMetaCardColors(
  meta: PageMetaV1 | undefined,
  colors: CardBlockColors | undefined,
): PageMetaV1 {
  const next = { ...(meta ?? {}) };
  const normalized = stripEmptyCardBlockColors(colors);
  if (normalized == null) {
    delete next.cardColors;
  } else {
    next.cardColors = normalized;
  }
  return next;
}

export function patchPageMetaMarkdownColors(
  meta: PageMetaV1 | undefined,
  colors: MarkdownBlockColors | undefined,
): PageMetaV1 {
  const next = { ...(meta ?? {}) };
  const normalized = stripEmptyMarkdownBlockColors(colors);
  if (normalized == null) {
    delete next.markdownColors;
  } else {
    next.markdownColors = normalized;
  }
  return next;
}
