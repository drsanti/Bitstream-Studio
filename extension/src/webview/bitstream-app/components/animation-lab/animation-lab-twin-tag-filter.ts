import type { AnimationLabTwinHealth } from "./digital-twin.types.js";

export type AnimationLabTwinTagFilterMode =
  | "all"
  | "issues"
  | "warnings"
  | "errors"
  | "hidden";

export type AnimationLabTwinTagFilterModeVisible = Exclude<
  AnimationLabTwinTagFilterMode,
  "hidden"
>;

export const ANIMATION_LAB_TWIN_TAG_FILTER_MODES: readonly AnimationLabTwinTagFilterMode[] = [
  "all",
  "issues",
  "warnings",
  "errors",
  "hidden",
] as const;

export type AnimationLabTwinTagFilterMenuOption = {
  value: AnimationLabTwinTagFilterMode;
  label: string;
  hint: string;
};

export const ANIMATION_LAB_TWIN_TAG_FILTER_MENU_OPTIONS: readonly AnimationLabTwinTagFilterMenuOption[] =
  [
    {
      value: "all",
      label: "All subsystems",
      hint: "Every tag that is enabled in Components",
    },
    {
      value: "issues",
      label: "Issues",
      hint: "Caution, warning, or error",
    },
    {
      value: "warnings",
      label: "Warnings & errors",
      hint: "Warning or error only",
    },
    {
      value: "errors",
      label: "Errors only",
      hint: "Critical faults only",
    },
    {
      value: "hidden",
      label: "Hidden",
      hint: "Hide all viewport tags",
    },
  ] as const;

export function isAnimationLabTwinTagFilterMode(
  value: string,
): value is AnimationLabTwinTagFilterMode {
  return (ANIMATION_LAB_TWIN_TAG_FILTER_MODES as readonly string[]).includes(value);
}

export function twinTagFilterModeIsVisible(
  mode: AnimationLabTwinTagFilterMode,
): mode is AnimationLabTwinTagFilterModeVisible {
  return mode !== "hidden";
}

export function twinTagFilterToolbarAccentClass(mode: AnimationLabTwinTagFilterMode): string {
  switch (mode) {
    case "all":
      return "border-cyan-500/50 text-cyan-200";
    case "issues":
      return "border-amber-500/50 text-amber-200";
    case "warnings":
      return "border-orange-500/50 text-orange-200";
    case "errors":
      return "border-rose-500/50 text-rose-200";
    case "hidden":
      return "";
  }
}

export function isTwinTagVisibleForFilter(args: {
  filterMode: AnimationLabTwinTagFilterMode;
  health: AnimationLabTwinHealth;
  componentId: string;
  selectedComponentId: string | null;
}): boolean {
  const { filterMode, health, componentId, selectedComponentId } = args;
  if (filterMode === "hidden") {
    return false;
  }
  if (filterMode === "all") {
    return true;
  }
  if (componentId === selectedComponentId) {
    return true;
  }
  switch (filterMode) {
    case "issues":
      return health === "caution" || health === "warning" || health === "error";
    case "warnings":
      return health === "warning" || health === "error";
    case "errors":
      return health === "error";
    default:
      return true;
  }
}
