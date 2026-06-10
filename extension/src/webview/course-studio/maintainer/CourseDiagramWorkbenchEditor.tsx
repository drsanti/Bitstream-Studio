import { lazy, Suspense, useState } from "react";
import { toast } from "react-toastify";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import { loadCourseDiagram } from "../content/diagramRegistry";
import { useCourseTelemetryLinkState } from "../runtime/useCourseTelemetryLinkState";
import { saveCourseDiagramDev } from "./saveCourseDiagramDev";
import { useCourseDiagramEditorStore } from "./useCourseDiagramEditorStore";
import { useCourseDiagramWorkbenchUiStore } from "../workbench/course-diagram-workbench-ui.store";

const CourseKonvaEditor = lazy(async () => {
  const mod = await import("./CourseKonvaEditor");
  return { default: mod.CourseKonvaEditor };
});

function KonvaLoadingFallback() {
  return (
    <div className="flex h-full min-h-[240px] items-center justify-center text-2xs text-[var(--text-muted)]">
      Loading live canvas…
    </div>
  );
}

export function CourseDiagramWorkbenchEditor({
  diagramId,
  pageStaleMs,
}: {
  diagramId: string;
  pageStaleMs?: number;
}) {
  const draft = useCourseDiagramEditorStore((s) => s.drafts[diagramId]);
  const dirty = useCourseDiagramEditorStore((s) => s.dirty[diagramId] === true);
  const sourcePath = useCourseDiagramEditorStore((s) => s.sourcePaths[diagramId] ?? "");
  const markDiagramClean = useCourseDiagramEditorStore((s) => s.markDiagramClean);
  const discardDiagram = useCourseDiagramEditorStore((s) => s.discardDiagram);
  const diagram = draft ?? loadCourseDiagram(diagramId);

  const { snapshot } = useCourseTelemetryLinkState(pageStaleMs);
  const setKonvaSelection = useCourseDiagramWorkbenchUiStore((s) => s.setKonvaSelection);

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (diagram == null || !dirty || sourcePath.length === 0) {
      return;
    }
    setSaving(true);
    try {
      const result = await saveCourseDiagramDev(sourcePath, diagram);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      markDiagramClean(diagramId, diagram);
      toast.success("Diagram saved to repo");
    } finally {
      setSaving(false);
    }
  };

  if (diagram == null) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center px-4 py-8 text-center">
        <TRNHintText>Diagram "{diagramId}" is not registered.</TRNHintText>
      </div>
    );
  }

  return (
    <div className="course-workbench-diagram-pane flex h-full min-h-0 flex-col overflow-hidden">
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <Suspense fallback={<KonvaLoadingFallback />}>
          <CourseKonvaEditor
            diagramId={diagramId}
            livePreview
            liveSnapshot={snapshot}
            onSelectedShapeChange={setKonvaSelection}
            diagramDirty={dirty}
            diagramSaving={saving}
            onDiscardDiagram={() => discardDiagram(diagramId)}
            onSaveDiagram={() => void handleSave()}
          />
        </Suspense>
      </div>
    </div>
  );
}
