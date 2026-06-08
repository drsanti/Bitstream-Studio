import type { DiagramLiveSnapshot } from "./diagram/diagramBindingCatalog";

/** Default when maintainer enables stale timeout without picking a value. */
export const DEFAULT_COURSE_STALE_MS = 2000;

export type CourseLinkHealthContext = {
  snapshot: DiagramLiveSnapshot;
  nowMs: number;
  lastRxAtMs: number | null;
  /** When set, samples older than this window count as stale even if transport is up. */
  staleMs?: number;
};

export function resolveCourseLastRxAtMs(
  bs2EvtSensorLastRxAtMs: number | null,
  firmwareLastRxAtMs: number | null,
): number | null {
  return bs2EvtSensorLastRxAtMs ?? firmwareLastRxAtMs;
}

export function isCourseLinkHealthy(ctx: CourseLinkHealthContext): boolean {
  if (!ctx.snapshot.connected || !ctx.snapshot.bmi270.hasSample) {
    return false;
  }
  if (ctx.staleMs == null) {
    return true;
  }
  if (ctx.lastRxAtMs == null) {
    return false;
  }
  return ctx.nowMs - ctx.lastRxAtMs <= ctx.staleMs;
}

export function courseLinkHealthTickMs(staleMs: number | undefined): number | null {
  if (staleMs == null) {
    return null;
  }
  return Math.min(500, Math.max(250, Math.floor(staleMs / 4)));
}
