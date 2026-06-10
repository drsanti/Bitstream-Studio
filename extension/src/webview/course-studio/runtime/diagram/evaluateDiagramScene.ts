import type { DiagramBindingV1, MapOpV1 } from "../../schemas/diagram.v1";
import type { DiagramLiveSnapshot } from "./diagramBindingCatalog";
import { resolveDiagramBindingPath, resolveBindingDisplayUnit } from "./diagramBindingCatalog";
import { applyBindingDisplayTransform } from "./courseBindingDisplayUnit";

export function applyMapOps(value: number, ops: MapOpV1[] | undefined): number {
  let current = value;
  for (const op of ops ?? []) {
    if (op.op === "scale") {
      const span = op.inMax - op.inMin;
      const t = span === 0 ? 0 : (current - op.inMin) / span;
      current = op.outMin + t * (op.outMax - op.outMin);
    } else if (op.op === "clamp") {
      current = Math.min(op.max, Math.max(op.min, current));
    }
  }
  return current;
}

function resolveBindingNumber(
  binding: DiagramBindingV1,
  snapshot: DiagramLiveSnapshot,
): number {
  const raw = resolveDiagramBindingPath(binding.path, snapshot);
  if (typeof raw === "boolean") {
    return raw ? 1 : 0;
  }
  if (typeof raw !== "number" || !Number.isFinite(raw)) {
    const fallback = binding.fallback;
    const base = typeof fallback === "number" ? fallback : 0;
    return applyBindingDisplayTransform(base, binding);
  }
  const mapped = applyMapOps(raw, binding.map);
  return applyBindingDisplayTransform(mapped, binding);
}

export { resolveBindingNumber };

export function evaluateBindingGate(
  binding: DiagramBindingV1 | undefined,
  snapshot: DiagramLiveSnapshot,
  threshold = 0.5,
): boolean {
  if (binding == null) {
    return false;
  }
  return resolveBindingNumber(binding, snapshot) >= threshold;
}

export function evaluateNumericProp(
  prop: number | { base?: number; mode: "absolute" | "add"; binding: DiagramBindingV1 },
  snapshot: DiagramLiveSnapshot,
): number {
  if (typeof prop === "number") {
    return prop;
  }
  const mapped = resolveBindingNumber(prop.binding, snapshot);
  if (prop.mode === "add") {
    return (prop.base ?? 0) + mapped;
  }
  return mapped;
}

export function formatBindingNumber(value: number, format: string | undefined): string {
  if (!format) {
    return value.toFixed(3);
  }
  const match = format.match(/^0\.(\d+)f?$/);
  if (match) {
    return value.toFixed(match[1].length);
  }
  return value.toFixed(3);
}

export function evaluateTextProp(
  prop: string | { binding: DiagramBindingV1; prefix?: string; suffix?: string },
  snapshot: DiagramLiveSnapshot,
): string {
  if (typeof prop === "string") {
    return prop;
  }
  const raw = resolveDiagramBindingPath(prop.binding.path, snapshot);
  if (typeof raw === "boolean") {
    return `${prop.prefix ?? ""}${raw ? "yes" : "no"}${prop.suffix ?? ""}`;
  }
  const numeric =
    typeof raw === "number" && Number.isFinite(raw)
      ? applyBindingDisplayTransform(applyMapOps(raw, prop.binding.map), prop.binding)
      : typeof prop.binding.fallback === "number"
        ? applyBindingDisplayTransform(prop.binding.fallback, prop.binding)
        : 0;
  const formatted = formatBindingNumber(numeric, prop.binding.format);
  const unit = resolveBindingDisplayUnit(prop.binding);
  const unitSuffix = unit.length > 0 ? ` ${unit}` : "";
  return `${prop.prefix ?? ""}${formatted}${unitSuffix}${prop.suffix ?? ""}`;
}
