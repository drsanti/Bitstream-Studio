import { useMemo } from "react";
import type { DiagramBindingV1 } from "../schemas/diagram.v1";
import {
  catalogEntryForPath,
  catalogLabelForPath,
  resolveBindingDisplayUnit,
  type DiagramBindingCatalogEntry,
} from "./diagram/diagramBindingCatalog";
import { applyMapOps, formatBindingNumber } from "./diagram/evaluateDiagramScene";
import { applyBindingDisplayTransform } from "./diagram/courseBindingDisplayUnit";
import { resolveDiagramBindingPath } from "./diagram/diagramBindingCatalog";
import {
  courseBindingHealthToSensorHealth,
  resolveCourseBindingHealthStatus,
  type CourseBindingHealthStatus,
} from "./courseBindingHealth";
import { useCourseTelemetryLinkState } from "./useCourseTelemetryLinkState";

export type CourseLiveBindingView = {
  binding: DiagramBindingV1 | null;
  rawValue: number | boolean | null;
  displayValue: number | null;
  displayText: string;
  unit: string;
  catalogEntry: DiagramBindingCatalogEntry | undefined;
  pathLabel: string;
  health: CourseBindingHealthStatus;
  sensorHealth: ReturnType<typeof courseBindingHealthToSensorHealth>;
};

function formatCourseBindingDisplay(args: {
  binding: DiagramBindingV1;
  rawValue: number | boolean | null;
  displayValue: number | null;
}): { displayText: string; unit: string } {
  const catalog = catalogEntryForPath(args.binding.path);
  const unit = resolveBindingDisplayUnit(args.binding);

  if (catalog?.valueKind === "boolean" || typeof args.rawValue === "boolean") {
    const on =
      typeof args.rawValue === "boolean"
        ? args.rawValue
        : (args.displayValue ?? 0) >= 0.5;
    return { displayText: on ? "On" : "Off", unit: "" };
  }

  if (args.displayValue == null || !Number.isFinite(args.displayValue)) {
    const fallback = args.binding.fallback;
    if (typeof fallback === "number" && Number.isFinite(fallback)) {
      const text = formatBindingNumber(fallback, args.binding.format);
      return { displayText: text, unit };
    }
    return { displayText: "—", unit };
  }

  const text = formatBindingNumber(args.displayValue, args.binding.format);
  return { displayText: text, unit };
}

export function evaluateCourseLiveBinding(args: {
  binding: DiagramBindingV1 | null | undefined;
  snapshot: ReturnType<typeof useCourseTelemetryLinkState>["snapshot"];
  nowMs: number;
  lastRxAtMs: number | null;
  staleMs?: number;
}): CourseLiveBindingView {
  const binding =
    args.binding?.path != null && args.binding.path.length > 0 ? args.binding : null;

  const rawValue =
    binding != null ? resolveDiagramBindingPath(binding.path, args.snapshot) : null;

  let displayValue: number | null = null;
  if (binding != null) {
    if (typeof rawValue === "boolean") {
      displayValue = rawValue ? 1 : 0;
    } else if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
      displayValue = applyBindingDisplayTransform(applyMapOps(rawValue, binding.map), binding);
    } else if (typeof binding.fallback === "number") {
      displayValue = applyBindingDisplayTransform(binding.fallback, binding);
    }
  }

  const { displayText, unit } =
    binding != null
      ? formatCourseBindingDisplay({ binding, rawValue, displayValue })
      : { displayText: "—", unit: "" };

  const health = resolveCourseBindingHealthStatus({
    binding,
    snapshot: args.snapshot,
    nowMs: args.nowMs,
    lastRxAtMs: args.lastRxAtMs,
    staleMs: args.staleMs,
  });

  return {
    binding,
    rawValue,
    displayValue,
    displayText,
    unit,
    catalogEntry: binding != null ? catalogEntryForPath(binding.path) : undefined,
    pathLabel: binding != null ? catalogLabelForPath(binding.path) : "Not mapped",
    health,
    sensorHealth: courseBindingHealthToSensorHealth(health),
  };
}

export function useCourseLiveBinding(
  binding: DiagramBindingV1 | null | undefined,
  staleMs?: number,
): CourseLiveBindingView {
  const { snapshot, lastRxAtMs, nowMs } = useCourseTelemetryLinkState(staleMs);

  return useMemo(
    () =>
      evaluateCourseLiveBinding({
        binding,
        snapshot,
        nowMs,
        lastRxAtMs,
        staleMs,
      }),
    [binding, snapshot, nowMs, lastRxAtMs, staleMs],
  );
}
