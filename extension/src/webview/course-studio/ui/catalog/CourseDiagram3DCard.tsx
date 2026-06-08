import { course3dSceneLabel, course3dSceneUsesLiveBinding } from "../../content/course3dSceneCatalog";
import type { Course3dSceneId } from "../../schemas/course3dScene";
import { useCourseTelemetryLinkState } from "../../runtime/useCourseTelemetryLinkState";
import { CourseDiagram3DSceneHost } from "./CourseDiagram3DSceneHost";

export function CourseDiagram3DCard({
  sceneId,
  caption,
  pageStaleMs,
}: {
  sceneId: Course3dSceneId;
  caption?: string;
  pageStaleMs?: number;
}) {
  const usesLive = course3dSceneUsesLiveBinding(sceneId);
  const { healthy } = useCourseTelemetryLinkState(pageStaleMs);
  const liveActive = usesLive && healthy;

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        {caption ? (
          <div className="text-2xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            {caption}
          </div>
        ) : (
          <span className="text-2xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            {course3dSceneLabel(sceneId)}
          </span>
        )}
        {usesLive ? (
          <span
            className="rounded-full border px-2 py-0.5 text-2xs font-semibold"
            style={{
              color: liveActive ? "var(--status-live)" : "var(--text-muted)",
              borderColor: liveActive
                ? "color-mix(in srgb, var(--status-live) 35%, transparent)"
                : "var(--surface-border)",
            }}
          >
            {liveActive ? "Live 3D" : "Frozen 3D"}
          </span>
        ) : null}
      </div>
      <div className="min-h-[180px] min-w-0 flex-1 overflow-hidden rounded-lg border border-[var(--surface-border)]">
        <CourseDiagram3DSceneHost sceneId={sceneId} className="h-full min-h-[180px]" />
      </div>
    </div>
  );
}
