import type { CSSProperties } from "react";

export type Scene3dSelectionHighlightStyle = "box" | "silhouette" | "both";

export type Scene3dSelectionRoleAppearance = {
  color: string;
  opacity: number;
  lineWidth: number;
};

export type Scene3dSelectionAppearancePresetId =
  | "blender"
  | "highContrast"
  | "monochrome"
  | "custom";

export type Scene3dSelectionAppearancePrefs = {
  enabled: boolean;
  style: Scene3dSelectionHighlightStyle;
  presetId: Scene3dSelectionAppearancePresetId;
  selected: Scene3dSelectionRoleAppearance;
  active: Scene3dSelectionRoleAppearance;
  syncOutlinerColors: boolean;
  showGroupOutlines: boolean;
  proceduralEmissiveTint: boolean;
};

export type Scene3dNodeHighlightRole = "none" | "selected" | "active";

export const SCENE_3D_SELECTION_LINE_WIDTH_MIN = 1;
export const SCENE_3D_SELECTION_LINE_WIDTH_MAX = 4;
export const SCENE_3D_SELECTION_OPACITY_MIN = 0.2;
export const SCENE_3D_SELECTION_OPACITY_MAX = 1;

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export const DEFAULT_SCENE_3D_SELECTION_APPEARANCE: Scene3dSelectionAppearancePrefs = {
  enabled: true,
  style: "both",
  presetId: "blender",
  selected: { color: "#38bdf8", opacity: 0.9, lineWidth: 1 },
  active: { color: "#f59e0b", opacity: 1, lineWidth: 2 },
  syncOutlinerColors: true,
  showGroupOutlines: true,
  proceduralEmissiveTint: true,
};

export const SCENE_3D_SELECTION_PRESET_LABELS: Record<
  Exclude<Scene3dSelectionAppearancePresetId, "custom">,
  string
> = {
  blender: "Blender (sky / amber)",
  highContrast: "High contrast",
  monochrome: "Monochrome",
};

export const SCENE_3D_SELECTION_CUSTOM_PRESET_LABEL = "Custom";

export type Scene3dSelectionPresetSelectOption = {
  value: Scene3dSelectionAppearancePresetId;
  label: string;
  disabled?: boolean;
};

export function buildScene3dSelectionPresetSelectOptions(): Scene3dSelectionPresetSelectOption[] {
  const named = (
    Object.entries(SCENE_3D_SELECTION_PRESET_LABELS) as [
      Exclude<Scene3dSelectionAppearancePresetId, "custom">,
      string,
    ][]
  ).map(([value, label]) => ({ value, label }));
  return [
    ...named,
    { value: "custom", label: SCENE_3D_SELECTION_CUSTOM_PRESET_LABEL, disabled: true },
  ];
}

function presetAppearance(
  presetId: Exclude<Scene3dSelectionAppearancePresetId, "custom">,
): Omit<Scene3dSelectionAppearancePrefs, "presetId"> {
  switch (presetId) {
    case "highContrast":
      return {
        enabled: true,
        style: "both",
        selected: { color: "#ffffff", opacity: 1, lineWidth: 1 },
        active: { color: "#fb923c", opacity: 1, lineWidth: 3 },
        syncOutlinerColors: true,
        showGroupOutlines: true,
        proceduralEmissiveTint: true,
      };
    case "monochrome":
      return {
        enabled: true,
        style: "silhouette",
        selected: { color: "#a1a1aa", opacity: 0.85, lineWidth: 1 },
        active: { color: "#fafafa", opacity: 1, lineWidth: 2 },
        syncOutlinerColors: true,
        showGroupOutlines: true,
        proceduralEmissiveTint: false,
      };
    case "blender":
    default:
      return {
        enabled: DEFAULT_SCENE_3D_SELECTION_APPEARANCE.enabled,
        style: DEFAULT_SCENE_3D_SELECTION_APPEARANCE.style,
        selected: { ...DEFAULT_SCENE_3D_SELECTION_APPEARANCE.selected },
        active: { ...DEFAULT_SCENE_3D_SELECTION_APPEARANCE.active },
        syncOutlinerColors: DEFAULT_SCENE_3D_SELECTION_APPEARANCE.syncOutlinerColors,
        showGroupOutlines: DEFAULT_SCENE_3D_SELECTION_APPEARANCE.showGroupOutlines,
        proceduralEmissiveTint: DEFAULT_SCENE_3D_SELECTION_APPEARANCE.proceduralEmissiveTint,
      };
  }
}

export function applyScene3dSelectionPreset(
  presetId: Exclude<Scene3dSelectionAppearancePresetId, "custom">,
): Scene3dSelectionAppearancePrefs {
  return {
    ...presetAppearance(presetId),
    presetId,
  };
}

function clampLineWidth(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  if (!Number.isFinite(parsed)) {
    return 1;
  }
  return Math.min(
    SCENE_3D_SELECTION_LINE_WIDTH_MAX,
    Math.max(SCENE_3D_SELECTION_LINE_WIDTH_MIN, parsed),
  );
}

function clampOpacity(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(
    SCENE_3D_SELECTION_OPACITY_MAX,
    Math.max(SCENE_3D_SELECTION_OPACITY_MIN, parsed),
  );
}

function parseRoleAppearance(
  raw: unknown,
  fallback: Scene3dSelectionRoleAppearance,
): Scene3dSelectionRoleAppearance {
  if (raw == null || typeof raw !== "object") {
    return { ...fallback };
  }
  const entry = raw as Record<string, unknown>;
  const color =
    typeof entry.color === "string" && HEX_COLOR.test(entry.color) ? entry.color : fallback.color;
  return {
    color,
    opacity: clampOpacity(entry.opacity, fallback.opacity),
    lineWidth: clampLineWidth(entry.lineWidth),
  };
}

export function parseScene3dSelectionAppearancePrefs(
  raw: unknown,
): Scene3dSelectionAppearancePrefs {
  if (raw == null || typeof raw !== "object") {
    return { ...DEFAULT_SCENE_3D_SELECTION_APPEARANCE };
  }
  const entry = raw as Record<string, unknown>;
  const presetId =
    entry.presetId === "blender" ||
    entry.presetId === "highContrast" ||
    entry.presetId === "monochrome" ||
    entry.presetId === "custom"
      ? entry.presetId
      : DEFAULT_SCENE_3D_SELECTION_APPEARANCE.presetId;
  const style =
    entry.style === "box" || entry.style === "silhouette" || entry.style === "both"
      ? entry.style
      : DEFAULT_SCENE_3D_SELECTION_APPEARANCE.style;

  return {
    enabled:
      typeof entry.enabled === "boolean"
        ? entry.enabled
        : DEFAULT_SCENE_3D_SELECTION_APPEARANCE.enabled,
    style,
    presetId,
    selected: parseRoleAppearance(entry.selected, DEFAULT_SCENE_3D_SELECTION_APPEARANCE.selected),
    active: parseRoleAppearance(entry.active, DEFAULT_SCENE_3D_SELECTION_APPEARANCE.active),
    syncOutlinerColors:
      typeof entry.syncOutlinerColors === "boolean"
        ? entry.syncOutlinerColors
        : DEFAULT_SCENE_3D_SELECTION_APPEARANCE.syncOutlinerColors,
    showGroupOutlines:
      typeof entry.showGroupOutlines === "boolean"
        ? entry.showGroupOutlines
        : DEFAULT_SCENE_3D_SELECTION_APPEARANCE.showGroupOutlines,
    proceduralEmissiveTint:
      typeof entry.proceduralEmissiveTint === "boolean"
        ? entry.proceduralEmissiveTint
        : DEFAULT_SCENE_3D_SELECTION_APPEARANCE.proceduralEmissiveTint,
  };
}

export function resolveScene3dNodeHighlightRole(
  nodeId: string,
  selectionIds: readonly string[],
  activeNodeId: string | null,
): Scene3dNodeHighlightRole {
  if (activeNodeId === nodeId) {
    return "active";
  }
  if (selectionIds.includes(nodeId)) {
    return "selected";
  }
  return "none";
}

export function shouldShowScene3dGroupOutline(
  nodeType: "model" | "group3d",
  role: Scene3dNodeHighlightRole,
  showGroupOutlines: boolean,
): boolean {
  if (role === "none") {
    return false;
  }
  if (nodeType === "model") {
    return true;
  }
  return showGroupOutlines;
}

export function resolveScene3dRoleAppearance(
  prefs: Scene3dSelectionAppearancePrefs,
  role: Scene3dNodeHighlightRole,
): Scene3dSelectionRoleAppearance | null {
  if (!prefs.enabled || role === "none") {
    return null;
  }
  return role === "active" ? prefs.active : prefs.selected;
}

/** Map inspector line width (1–4) to drei Outlines thickness. */
export function scene3dOutlineThicknessFromLineWidth(lineWidth: number): number {
  const t = (lineWidth - SCENE_3D_SELECTION_LINE_WIDTH_MIN) /
    (SCENE_3D_SELECTION_LINE_WIDTH_MAX - SCENE_3D_SELECTION_LINE_WIDTH_MIN);
  return 0.02 + t * 0.06;
}

export function hexToThreeColor(hex: string): number {
  return Number.parseInt(hex.replace("#", ""), 16);
}

export function proceduralEmissiveBoostForRole(
  prefs: Scene3dSelectionAppearancePrefs,
  role: Scene3dNodeHighlightRole,
): number {
  if (!prefs.proceduralEmissiveTint || role === "none") {
    return 0;
  }
  return role === "active" ? 0.28 : 0.16;
}

export type Scene3dOutlinerSelectionVisual = {
  className: string;
  style?: CSSProperties;
  showActiveBadge: boolean;
};

export function resolveScene3dOutlinerSelectionVisual(
  prefs: Scene3dSelectionAppearancePrefs,
  selected: boolean,
  active: boolean,
  dropTarget: boolean,
): Scene3dOutlinerSelectionVisual {
  const base =
    "flex w-full items-center gap-1 rounded-md border py-1 text-left text-[11px] transition";

  if (dropTarget) {
    if (prefs.syncOutlinerColors) {
      return {
        className: base,
        style: {
          borderColor: `color-mix(in srgb, ${prefs.active.color} 50%, transparent)`,
          backgroundColor: `color-mix(in srgb, ${prefs.active.color} 15%, transparent)`,
          color: prefs.active.color,
        },
        showActiveBadge: false,
      };
    }
    return {
      className: `${base} border-amber-400/50 bg-amber-500/15 text-amber-100`,
      showActiveBadge: false,
    };
  }

  if (active) {
    if (prefs.syncOutlinerColors) {
      return {
        className: `${base} border-l-2 font-semibold`,
        style: {
          borderColor: `color-mix(in srgb, ${prefs.active.color} 40%, transparent)`,
          borderLeftColor: prefs.active.color,
          backgroundColor: `color-mix(in srgb, ${prefs.active.color} 12%, transparent)`,
          color: prefs.active.color,
        },
        showActiveBadge: true,
      };
    }
    return {
      className: `${base} border-amber-400/40 border-l-2 border-l-amber-400/90 bg-amber-500/12 font-semibold text-amber-100`,
      showActiveBadge: true,
    };
  }

  if (selected) {
    if (prefs.syncOutlinerColors) {
      return {
        className: base,
        style: {
          borderColor: `color-mix(in srgb, ${prefs.selected.color} 40%, transparent)`,
          backgroundColor: `color-mix(in srgb, ${prefs.selected.color} 10%, transparent)`,
          color: prefs.selected.color,
        },
        showActiveBadge: false,
      };
    }
    return {
      className: `${base} border-sky-500/40 bg-sky-500/10 text-sky-100`,
      showActiveBadge: false,
    };
  }

  return {
    className: `${base} border-transparent text-zinc-400 hover:border-[var(--surface-border)] hover:bg-[var(--surface-card)] hover:text-zinc-200`,
    showActiveBadge: false,
  };
}

export function markScene3dSelectionAppearanceCustom(
  prefs: Scene3dSelectionAppearancePrefs,
): Scene3dSelectionAppearancePrefs {
  return prefs.presetId === "custom" ? prefs : { ...prefs, presetId: "custom" };
}

/** Groups use bounding box for silhouette/both (no mesh hull to outline). */
export function resolveScene3dHighlightStyleForNode(
  prefs: Scene3dSelectionAppearancePrefs,
  nodeType: "model" | "group3d",
): Scene3dSelectionHighlightStyle {
  if (nodeType === "group3d" && prefs.style !== "box") {
    return "box";
  }
  return prefs.style;
}
