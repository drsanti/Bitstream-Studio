import type { SensorHealthStatus } from "../../sensor-studio/features/editor/store/flow-editor.store";
import type { DiagramBindingV1 } from "../schemas/diagram.v1";
import { resolveDiagramBindingPath, snapshotHasSampleForBindingPath } from "./diagram/diagramBindingCatalog";
import type { DiagramLiveSnapshot } from "./diagram/diagramBindingCatalog";
import {
  DEFAULT_COURSE_STALE_MS,
  isCourseLinkHealthy,
  type CourseLinkHealthContext,
} from "./courseTelemetryFreshness";

export type CourseBindingHealthStatus = "static" | "idle" | "live" | "stale";

export function resolveCourseBindingHealthStatus(args: {
  binding: DiagramBindingV1 | null | undefined;
  snapshot: DiagramLiveSnapshot;
  nowMs: number;
  lastRxAtMs: number | null;
  staleMs?: number;
}): CourseBindingHealthStatus {
  if (args.binding?.path == null || args.binding.path.length === 0) {
    return "static";
  }
  if (!args.snapshot.connected) {
    return "idle";
  }
  if (!snapshotHasSampleForBindingPath(args.binding.path, args.snapshot)) {
    return "idle";
  }
  const raw = resolveDiagramBindingPath(args.binding.path, args.snapshot);
  if (raw == null) {
    return "idle";
  }
  const linkCtx: CourseLinkHealthContext = {
    snapshot: args.snapshot,
    nowMs: args.nowMs,
    lastRxAtMs: args.lastRxAtMs,
    staleMs: args.staleMs ?? DEFAULT_COURSE_STALE_MS,
  };
  if (!isCourseLinkHealthy(linkCtx)) {
    return "stale";
  }
  return "live";
}

export function courseBindingHealthLabel(status: CourseBindingHealthStatus): string {
  switch (status) {
    case "static":
      return "STATIC";
    case "idle":
      return "WAIT";
    case "live":
      return "LIVE";
    case "stale":
      return "STALE";
  }
}

export function courseBindingHealthClass(status: CourseBindingHealthStatus): string {
  switch (status) {
    case "static":
      return "text-zinc-500";
    case "idle":
      return "text-amber-400/90";
    case "live":
      return "text-emerald-400/90";
    case "stale":
      return "text-orange-400/90";
  }
}

export function courseBindingHealthToSensorHealth(
  status: CourseBindingHealthStatus,
): SensorHealthStatus | undefined {
  switch (status) {
    case "live":
      return "live";
    case "stale":
      return "stale";
    case "idle":
      return "offline";
    case "static":
      return undefined;
  }
}
