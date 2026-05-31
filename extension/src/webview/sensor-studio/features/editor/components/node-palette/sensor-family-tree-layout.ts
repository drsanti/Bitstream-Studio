/**
 * Sensor family grouped-panel tree layout (Library hardware sections).
 *
 * - classic: root row + branch lines to tap rows (file-tree style)
 * - compact: same structure, narrower gutter
 * - header-root: root inline in panel header; only taps in the list
 */

export type SensorFamilyTreeLayout = "classic" | "compact" | "header-root";

export type SensorFamilyTreeGutterRole =
  | "root"
  | "tap-middle"
  | "tap-last"
  | "header-root";

export const SENSOR_FAMILY_TREE_LAYOUT_OPTIONS: ReadonlyArray<{
  id: SensorFamilyTreeLayout;
  label: string;
  title: string;
}> = [
  {
    id: "classic",
    label: "Tree",
    title: "Classic file tree — root row with branch lines to taps",
  },
  {
    id: "compact",
    label: "Compact",
    title: "Narrow tree gutter — same hierarchy, tighter spacing",
  },
  {
    id: "header-root",
    label: "Inline",
    title: "Root in the panel header — taps branch below",
  },
];

export function treeGutterWidthClass(
  layout: SensorFamilyTreeLayout,
  dense: boolean,
): string {
  if (layout === "compact") {
    return dense ? "w-2.5" : "w-3";
  }
  return dense ? "w-3.5" : "w-4";
}

export function treeTapRowPaddingClass(
  layout: SensorFamilyTreeLayout,
  dense: boolean,
): string {
  if (layout === "compact") {
    return dense ? "py-0.5 pl-1 pr-2" : "py-1 pl-1.5 pr-2.5";
  }
  return dense ? "py-1 pl-2 pr-2" : "py-1.5 pl-2.5 pr-2.5";
}

export function treeRootRowPaddingClass(
  layout: SensorFamilyTreeLayout,
  dense: boolean,
): string {
  if (layout === "compact") {
    return dense ? "px-2 py-1.5" : "px-2 py-2";
  }
  return dense ? "px-2.5 py-2" : "px-2.5 py-2.5";
}

/** Absolute trunk line `left` offset inside grouped tap lists (rem). */
export function treeTrunkLeftRem(
  layout: SensorFamilyTreeLayout,
  dense: boolean,
  mode: "with-root-row" | "header-root-taps",
): string {
  if (mode === "header-root-taps") {
    return layout === "compact" ? (dense ? "1.15rem" : "1.25rem") : dense ? "1.35rem" : "1.45rem";
  }
  if (layout === "compact") {
    return dense ? "1.55rem" : "1.65rem";
  }
  return dense ? "1.85rem" : "1.95rem";
}

export function treeTrunkTopRem(
  layout: SensorFamilyTreeLayout,
  dense: boolean,
  mode: "with-root-row" | "header-root-taps",
): string {
  if (mode === "header-root-taps") {
    return "0";
  }
  if (layout === "compact") {
    return dense ? "1.65rem" : "1.85rem";
  }
  return dense ? "1.95rem" : "2.15rem";
}
