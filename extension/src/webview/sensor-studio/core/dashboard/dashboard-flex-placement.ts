export type DashboardFlexPlacementV1 = {
  order: number;
  grow: number;
  shrink: number;
  basis: string;
};

export const DEFAULT_DASHBOARD_FLEX_PLACEMENT: DashboardFlexPlacementV1 = {
  order: 0,
  grow: 1,
  shrink: 1,
  basis: "auto",
};

function readFlexNumber(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, n));
}

export function coerceDashboardFlexPlacementV1(raw: unknown): DashboardFlexPlacementV1 {
  if (raw == null || typeof raw !== "object") {
    return { ...DEFAULT_DASHBOARD_FLEX_PLACEMENT };
  }
  const o = raw as Record<string, unknown>;
  const basisRaw = o.basis;
  const basis =
    typeof basisRaw === "string" && basisRaw.trim().length > 0
      ? basisRaw.trim()
      : DEFAULT_DASHBOARD_FLEX_PLACEMENT.basis;
  return {
    order: readFlexNumber(o.order, DEFAULT_DASHBOARD_FLEX_PLACEMENT.order, -24, 48),
    grow: readFlexNumber(o.grow, DEFAULT_DASHBOARD_FLEX_PLACEMENT.grow, 0, 8),
    shrink: readFlexNumber(o.shrink, DEFAULT_DASHBOARD_FLEX_PLACEMENT.shrink, 0, 8),
    basis,
  };
}

export function dashboardFlexPlacementStyle(
  flex: DashboardFlexPlacementV1,
): {
  order: number;
  flexGrow: number;
  flexShrink: number;
  flexBasis: string;
  minWidth: number;
} {
  return {
    order: flex.order,
    flexGrow: flex.grow,
    flexShrink: flex.shrink,
    flexBasis: flex.basis,
    minWidth: 0,
  };
}
