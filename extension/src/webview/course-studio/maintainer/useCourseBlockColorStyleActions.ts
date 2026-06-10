import { toast } from "react-toastify";
import type { CardBlockColors } from "../schemas/cardBlockColors";
import type { DashboardWidgetBlockColors } from "../schemas/dashboardWidgetBlockColors";
import { findCardThemePreset, findMarkdownThemePreset, slugifyCourseThemePresetId } from "../schemas/courseThemes.v1";
import type { SensorTelemetryCardBlockColors } from "../schemas/sensorTelemetryCardBlockColors";
import { resolveSensorTelemetryCardEffectiveColors } from "../schemas/sensorTelemetryCardAppearance";
import type { SensorTelemetryCardAppearance } from "../schemas/sensorTelemetryCardAppearance";
import {
  resolveCardBlockEffectiveColors,
  resolveDashboardWidgetBlockEffectiveColors,
  resolveMarkdownBlockEffectiveColors,
} from "../runtime/resolveBlockColors";
import {
  applyCardColorsToPageBlocks,
  applyDashboardWidgetColorsToPageBlocks,
  applyMarkdownColorsToPageBlocks,
  applySensorTelemetryCardColorsToPageBlocks,
  type BlockColorBulkApplyMode,
} from "./pageBlockColorActions";
import { useCourseOutlineStore } from "./useCourseOutlineStore";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";

function requirePage() {
  const page = useCoursePageEditorStore.getState().page;
  if (page == null) {
    throw new Error("No page loaded");
  }
  return page;
}

export function useCourseCardColorStyleActions(
  block: { colors?: CardBlockColors },
): {
  applyToAll: (mode: BlockColorBulkApplyMode) => void;
  setPageDefault: () => void;
  savePreset: (title: string) => void;
  applyPreset: (presetId: string, mode: BlockColorBulkApplyMode) => void;
} {
  const courseThemes = useCourseOutlineStore((s) => s.course?.themes);

  const getSourceColors = () => {
    const page = requirePage();
    return resolveCardBlockEffectiveColors(block.colors, page.meta, courseThemes);
  };

  return {
    applyToAll: (mode) => {
      const page = requirePage();
      const colors = getSourceColors();
      const blocks = applyCardColorsToPageBlocks(page, colors, mode);
      useCoursePageEditorStore.getState().setBlocks(blocks);
      toast.success(`Applied card colors (${mode === "replace" ? "replace all" : "merge"})`);
    },
    setPageDefault: () => {
      const colors = getSourceColors();
      useCoursePageEditorStore.getState().updatePageMeta({
        cardColors: colors,
      });
      toast.success("Card colors set as page default");
    },
    savePreset: (title) => {
      const colors = getSourceColors();
      if (colors == null) {
        toast.info("Set at least one card color before saving a preset");
        return;
      }
      const id = useCourseOutlineStore.getState().upsertCardThemePreset(title, colors);
      toast.success(`Saved preset “${title}” (${id}). Save the course to persist.`);
    },
    applyPreset: (presetId, mode) => {
      const page = requirePage();
      const preset = findCardThemePreset(courseThemes, presetId);
      if (preset == null) {
        toast.error("Preset not found");
        return;
      }
      const blocks = applyCardColorsToPageBlocks(page, preset.colors, mode);
      useCoursePageEditorStore.getState().setBlocks(blocks);
      useCoursePageEditorStore.getState().updatePageMeta({
        ...page.meta,
        cardThemePresetId: presetId,
      });
      toast.success(`Applied preset “${preset.title}”`);
    },
  };
}

export function useCourseMarkdownColorStyleActions(
  block: { colors?: MarkdownBlockColors },
): {
  applyToAll: (mode: BlockColorBulkApplyMode) => void;
  setPageDefault: () => void;
  savePreset: (title: string) => void;
  applyPreset: (presetId: string, mode: BlockColorBulkApplyMode) => void;
} {
  const courseThemes = useCourseOutlineStore((s) => s.course?.themes);

  const getSourceColors = () => {
    const page = requirePage();
    return resolveMarkdownBlockEffectiveColors(block.colors, page.meta, courseThemes);
  };

  return {
    applyToAll: (mode) => {
      const page = requirePage();
      const colors = getSourceColors();
      const blocks = applyMarkdownColorsToPageBlocks(page, colors, mode);
      useCoursePageEditorStore.getState().setBlocks(blocks);
      toast.success(`Applied markdown colors (${mode === "replace" ? "replace all" : "merge"})`);
    },
    setPageDefault: () => {
      const colors = getSourceColors();
      useCoursePageEditorStore.getState().updatePageMeta({
        markdownColors: colors,
      });
      toast.success("Markdown colors set as page default");
    },
    savePreset: (title) => {
      const colors = getSourceColors();
      if (colors == null) {
        toast.info("Set at least one markdown color before saving a preset");
        return;
      }
      const id = useCourseOutlineStore.getState().upsertMarkdownThemePreset(title, colors);
      toast.success(`Saved preset “${title}” (${id}). Save the course to persist.`);
    },
    applyPreset: (presetId, mode) => {
      const page = requirePage();
      const preset = findMarkdownThemePreset(courseThemes, presetId);
      if (preset == null) {
        toast.error("Preset not found");
        return;
      }
      const blocks = applyMarkdownColorsToPageBlocks(page, preset.colors, mode);
      useCoursePageEditorStore.getState().setBlocks(blocks);
      useCoursePageEditorStore.getState().updatePageMeta({
        ...page.meta,
        markdownThemePresetId: presetId,
      });
      toast.success(`Applied preset “${preset.title}”`);
    },
  };
}

export function useCourseDashboardWidgetColorStyleActions(
  block: { colors?: DashboardWidgetBlockColors },
): {
  applyToAll: (mode: BlockColorBulkApplyMode) => void;
  setPageDefault: () => void;
} {
  const courseThemes = useCourseOutlineStore((s) => s.course?.themes);

  const getSourceColors = () => {
    const page = requirePage();
    return resolveDashboardWidgetBlockEffectiveColors(block.colors, page.meta, courseThemes);
  };

  return {
    applyToAll: (mode) => {
      const page = requirePage();
      const colors = getSourceColors();
      const blocks = applyDashboardWidgetColorsToPageBlocks(page, colors, mode);
      useCoursePageEditorStore.getState().setBlocks(blocks);
      toast.success(
        `Applied widget container colors (${mode === "replace" ? "replace all" : "merge"})`,
      );
    },
    setPageDefault: () => {
      const colors = getSourceColors();
      useCoursePageEditorStore.getState().updatePageMeta({
        dashboardWidgetColors: colors,
      });
      toast.success("Dashboard widget colors set as page default");
    },
  };
}

export function useCourseSensorTelemetryCardColorStyleActions(block: {
  appearance?: SensorTelemetryCardAppearance;
}): {
  applyToAll: (mode: BlockColorBulkApplyMode) => void;
  setPageDefault: () => void;
} {
  const getSourceColors = (): SensorTelemetryCardBlockColors | undefined => {
    const page = requirePage();
    return resolveSensorTelemetryCardEffectiveColors(
      block.appearance,
      page.meta?.sensorTelemetryCardColors,
    );
  };

  return {
    applyToAll: (mode) => {
      const page = requirePage();
      const colors = getSourceColors();
      const blocks = applySensorTelemetryCardColorsToPageBlocks(page, colors, mode);
      useCoursePageEditorStore.getState().setBlocks(blocks);
      toast.success(
        `Applied sensor card colors (${mode === "replace" ? "replace all" : "merge"})`,
      );
    },
    setPageDefault: () => {
      const colors = getSourceColors();
      useCoursePageEditorStore.getState().updatePageMeta({
        sensorTelemetryCardColors: colors,
      });
      toast.success("Sensor card colors set as page default");
    },
  };
}
