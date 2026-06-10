import type { LinkHealthPolicy } from "../../schemas/linkHealth";
import type { DiagramLiveSnapshot } from "./diagramBindingCatalog";
import { snapshotHasAnySensorSample } from "./diagramBindingCatalog";
import {
  isCourseLinkHealthy,
  type CourseLinkHealthContext,
} from "../courseTelemetryFreshness";

export function isDiagramLinkHealthy(
  snapshot: DiagramLiveSnapshot,
  freshness?: Pick<CourseLinkHealthContext, "nowMs" | "lastRxAtMs" | "staleMs">,
): boolean {
  if (freshness != null) {
    return isCourseLinkHealthy({
      snapshot,
      nowMs: freshness.nowMs ?? Date.now(),
      lastRxAtMs: freshness.lastRxAtMs ?? null,
      staleMs: freshness.staleMs,
    });
  }
  return snapshot.connected && snapshotHasAnySensorSample(snapshot);
}

export function resolveDiagramRenderSnapshot(args: {
  current: DiagramLiveSnapshot;
  lastGood: DiagramLiveSnapshot | null;
  policy: LinkHealthPolicy;
  freshness?: Pick<CourseLinkHealthContext, "nowMs" | "lastRxAtMs" | "staleMs">;
}): { snapshot: DiagramLiveSnapshot; inactive: boolean; hidden: boolean } {
  const healthy = isDiagramLinkHealthy(args.current, args.freshness);
  if (healthy) {
    return { snapshot: args.current, inactive: false, hidden: false };
  }

  switch (args.policy) {
    case "freeze-gray":
      return {
        snapshot: args.lastGood ?? args.current,
        inactive: true,
        hidden: false,
      };
    case "last-no-style":
      return {
        snapshot: args.lastGood ?? args.current,
        inactive: false,
        hidden: false,
      };
    case "fallback":
      return { snapshot: args.current, inactive: true, hidden: false };
    case "hide":
      return { snapshot: args.current, inactive: false, hidden: true };
    default:
      return {
        snapshot: args.lastGood ?? args.current,
        inactive: true,
        hidden: false,
      };
  }
}
