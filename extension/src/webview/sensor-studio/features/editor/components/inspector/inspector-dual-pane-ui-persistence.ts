const PREFIX = "ternion.sensor-studio.inspectorDualPane.";

const DIRECTION_KEY = `${PREFIX}direction.v1`;
const PINNED_FIRST_KEY = `${PREFIX}pinnedFirst.v1`;
const PRIMARY_RATIO_KEY = `${PREFIX}primaryRatio.v1`;

export type InspectorDualPaneDirection = "vertical" | "horizontal";

export type InspectorDualPaneLayout = {
  direction: InspectorDualPaneDirection;
  pinnedFirst: boolean;
  primaryRatio: number;
};

const DEFAULT_LAYOUT: InspectorDualPaneLayout = {
  direction: "vertical",
  pinnedFirst: true,
  primaryRatio: 0.45,
};

function clampRatio(raw: number): number {
  if (!Number.isFinite(raw)) {
    return DEFAULT_LAYOUT.primaryRatio;
  }
  return Math.max(0.28, Math.min(0.72, raw));
}

export function readInspectorDualPaneLayout(): InspectorDualPaneLayout {
  try {
    const direction = localStorage.getItem(DIRECTION_KEY);
    const pinnedFirst = localStorage.getItem(PINNED_FIRST_KEY);
    const ratioRaw = localStorage.getItem(PRIMARY_RATIO_KEY);
    return {
      direction: direction === "horizontal" ? "horizontal" : "vertical",
      pinnedFirst: pinnedFirst !== "false",
      primaryRatio:
        ratioRaw != null ? clampRatio(Number(ratioRaw)) : DEFAULT_LAYOUT.primaryRatio,
    };
  } catch {
    return DEFAULT_LAYOUT;
  }
}

export function writeInspectorDualPaneLayout(patch: Partial<InspectorDualPaneLayout>): void {
  const current = readInspectorDualPaneLayout();
  const next = { ...current, ...patch };
  try {
    localStorage.setItem(
      DIRECTION_KEY,
      next.direction === "horizontal" ? "horizontal" : "vertical",
    );
    localStorage.setItem(PINNED_FIRST_KEY, next.pinnedFirst ? "true" : "false");
    localStorage.setItem(PRIMARY_RATIO_KEY, String(clampRatio(next.primaryRatio)));
  } catch {
    /* ignore */
  }
}

export function clampInspectorDualPanePrimaryRatio(raw: number): number {
  return clampRatio(raw);
}
