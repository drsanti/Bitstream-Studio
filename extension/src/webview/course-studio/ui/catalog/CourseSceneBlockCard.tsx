import { CourseDiagram3DLayer } from "../../runtime/diagram/CourseDiagram3DLayer";
import type { LinkHealthPolicy } from "../../schemas/linkHealth";
import { useCourseTelemetryLinkState } from "../../runtime/useCourseTelemetryLinkState";
import { ensureCourseSceneDraft, loadCourseScene } from "../../content/sceneRegistry";
import { useCourseSceneEditorStore } from "../../maintainer/useCourseSceneEditorStore";
import { sceneV1ToDiagramV1 } from "../../runtime/scene/sceneDiagramBridge";
import {
  COURSE_CATALOG_BLOCK_LABEL_CLASS,
  COURSE_CATALOG_STATUS_CHIP_CLASS,
  courseLiveCanvasStatusLabel,
} from "./course-catalog-ui";
import { sceneUsesLiveBinding } from "../../runtime/scene/sceneLiveBinding";

export function CourseSceneBlockCard({
  documentId,
  caption,
  pageLinkHealth,
  pageStaleMs,
  chromeless = false,
}: {
  documentId: string;
  caption?: string;
  pageLinkHealth?: LinkHealthPolicy;
  pageStaleMs?: number;
  chromeless?: boolean;
}) {
  ensureCourseSceneDraft(documentId);
  const sceneDraft = useCourseSceneEditorStore((s) => s.drafts[documentId]);
  const scene = sceneDraft ?? loadCourseScene(documentId);

  if (scene == null) {
    return (
      <div className="flex h-full min-h-[180px] items-center justify-center rounded-xl border border-dashed border-[var(--surface-border)] bg-[var(--surface-card)] px-4 text-sm text-[var(--text-muted)]">
        Missing scene: {documentId}
      </div>
    );
  }

  const usesLive = sceneUsesLiveBinding(scene);
  const { healthy } = useCourseTelemetryLinkState(pageStaleMs);
  const liveActive = usesLive && healthy;
  const label = caption?.trim() ? caption : (scene.title?.trim() || documentId);

  return (
    <div
      className={
        chromeless
          ? "course-scene-3d-card flex h-full min-h-0 flex-col"
          : "course-scene-3d-card flex h-full min-h-0 flex-col gap-1.5 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] px-2.5 py-2"
      }
    >
      {chromeless ? null : (
        <div className="flex min-h-[21px] items-center justify-between gap-2">
          <span className={COURSE_CATALOG_BLOCK_LABEL_CLASS}>{label}</span>
          {usesLive ? (
            <span
              className={COURSE_CATALOG_STATUS_CHIP_CLASS}
              style={{
                color: liveActive ? "var(--status-live)" : "var(--text-muted)",
                borderColor: liveActive
                  ? "color-mix(in srgb, var(--status-live) 35%, transparent)"
                  : "var(--surface-border)",
              }}
            >
              {courseLiveCanvasStatusLabel(usesLive, liveActive)}
            </span>
          ) : null}
        </div>
      )}
      <div
        className={
          chromeless
            ? "flex min-h-[180px] min-w-0 flex-1 flex-col overflow-hidden"
            : "flex min-h-[180px] min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-[var(--surface-border)]"
        }
      >
        <CourseDiagram3DLayer
          diagram={sceneV1ToDiagramV1(scene)}
          pageLinkHealth={pageLinkHealth}
          pageStaleMs={pageStaleMs}
          environmentSettings={scene.settings}
          className="min-h-0 flex-1"
        />
      </div>
    </div>
  );
}
