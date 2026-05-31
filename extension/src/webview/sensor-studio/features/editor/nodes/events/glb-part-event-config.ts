/** Scalar visibility for GLB **part** drives: 0 = hidden, 1 = visible (> 0.5 visible in preview). */

export function readGlbPartVisibilityScalar(defaultConfig: Record<string, unknown>): number {
  const raw = defaultConfig.value;
  if (typeof raw === "boolean") {
    return raw ? 1 : 0;
  }
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw > 0.5 ? 1 : 0;
  }
  if (typeof raw === "string") {
    const s = raw.trim().toLowerCase();
    if (s === "true" || s === "1" || s === "yes" || s === "visible" || s === "on") {
      return 1;
    }
    if (s === "false" || s === "0" || s === "no" || s === "hidden" || s === "off") {
      return 0;
    }
  }
  return 0;
}

export function readGlbPartSetVisibleTarget(defaultConfig: Record<string, unknown>): number {
  const raw = defaultConfig.setTo;
  if (typeof raw === "boolean") {
    return raw ? 1 : 0;
  }
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw > 0.5 ? 1 : 0;
  }
  if (typeof raw === "string") {
    const s = raw.trim().toLowerCase();
    if (s === "true" || s === "1" || s === "yes" || s === "visible" || s === "on") {
      return 1;
    }
    if (s === "false" || s === "0" || s === "no" || s === "hidden" || s === "off") {
      return 0;
    }
  }
  return 1;
}

export function toggleGlbPartVisibilityScalar(current: number): number {
  return current > 0.5 ? 0 : 1;
}

export function formatGlbPartVisibilityLabel(scalar: number): string {
  return scalar > 0.5 ? "Visible" : "Hidden";
}
