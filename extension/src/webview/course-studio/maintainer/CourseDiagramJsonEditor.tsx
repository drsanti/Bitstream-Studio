import { useEffect, useMemo, useRef, useState } from "react";
import { Redo2, Save, Undo2 } from "lucide-react";
import { toast } from "react-toastify";
import { TRNButton } from "../../ui/TRN/TRNButton";
import { TRNFormField, TRNFormSection } from "../../ui/TRN/TRNForm";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import { TRNHighlightedJsonTextarea } from "../../ui/TRN/TRNHighlightedJsonTextarea";
import { loadCourseDiagram, getCourseDiagramSourcePath } from "../content/diagramRegistry";
import { catalogLabelForPath, DIAGRAM_BINDING_CATALOG } from "../runtime/diagram/diagramBindingCatalog";
import { collectDiagramBindingPaths } from "../runtime/diagram/collectDiagramBindings";
import { CourseDiagramCanvasEditor } from "./CourseDiagramCanvasEditor";
import { CourseDiagramNodeInspector } from "./CourseDiagramNodeInspector";
import { saveCourseDiagramDev } from "./saveCourseDiagramDev";
import { useCourseDiagramEditorStore } from "./useCourseDiagramEditorStore";

export function CourseDiagramJsonEditor({
  diagramId,
  embedded = false,
}: {
  diagramId: string;
  embedded?: boolean;
}) {
  const draft = useCourseDiagramEditorStore((s) => s.drafts[diagramId]);
  const dirty = useCourseDiagramEditorStore((s) => s.dirty[diagramId] === true);
  const sourcePath = useCourseDiagramEditorStore((s) => s.sourcePaths[diagramId] ?? "");
  const setDraftJson = useCourseDiagramEditorStore((s) => s.setDraftJson);
  const discardDiagram = useCourseDiagramEditorStore((s) => s.discardDiagram);
  const markDiagramClean = useCourseDiagramEditorStore((s) => s.markDiagramClean);
  const undoDiagram = useCourseDiagramEditorStore((s) => s.undoDiagram);
  const redoDiagram = useCourseDiagramEditorStore((s) => s.redoDiagram);
  const canUndo = useCourseDiagramEditorStore(
    (s) => (s.historyStacks[diagramId]?.undo.length ?? 0) > 0,
  );
  const canRedo = useCourseDiagramEditorStore(
    (s) => (s.historyStacks[diagramId]?.redo.length ?? 0) > 0,
  );

  const diagram = draft ?? loadCourseDiagram(diagramId);
  const [jsonText, setJsonText] = useState(() =>
    diagram != null ? JSON.stringify(diagram, null, 2) : "",
  );
  const [parseError, setParseError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const skipDiagramJsonSyncRef = useRef(false);

  useEffect(() => {
    if (diagram == null) {
      return;
    }
    if (skipDiagramJsonSyncRef.current) {
      skipDiagramJsonSyncRef.current = false;
      return;
    }
    setJsonText(JSON.stringify(diagram, null, 2));
    setParseError(null);
  }, [diagram, diagramId]);

  const bindingPaths = useMemo(
    () => (diagram != null ? collectDiagramBindingPaths(diagram) : []),
    [diagram],
  );

  const syncJsonFromDraft = () => {
    if (diagram != null) {
      setJsonText(JSON.stringify(diagram, null, 2));
      setParseError(null);
    }
  };

  const handleJsonChange = (value: string) => {
    setJsonText(value);
    skipDiagramJsonSyncRef.current = true;
    const result = setDraftJson(diagramId, value);
    setParseError(result.ok ? null : result.error);
  };

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
      <TRNHintText>
        Diagram "{diagramId}" is not registered. Source:{" "}
        {getCourseDiagramSourcePath(diagramId) ?? "unknown"}
      </TRNHintText>
    );
  }

  const body = (
    <div className="flex flex-col gap-3">
      <TRNHintText>
        Canvas drag + JSON — bound properties (e.g. proof-mass Y) stay driven by live data.
      </TRNHintText>

      <CourseDiagramCanvasEditor diagram={diagram} />

      <div className="flex flex-wrap gap-2">
        <TRNButton
          size="compact"
          disabled={!canUndo}
          hint="Undo diagram edit (Ctrl+Z / Cmd+Z)"
          onClick={() => undoDiagram(diagramId)}
        >
          <Undo2 size={13} strokeWidth={2} className="mr-1 inline" />
          Undo
        </TRNButton>
        <TRNButton
          size="compact"
          disabled={!canRedo}
          hint="Redo diagram edit (Ctrl+Shift+Z / Ctrl+Y)"
          onClick={() => redoDiagram(diagramId)}
        >
          <Redo2 size={13} strokeWidth={2} className="mr-1 inline" />
          Redo
        </TRNButton>
      </div>

      <CourseDiagramNodeInspector diagramId={diagramId} diagram={diagram} />

      <div className="flex flex-wrap gap-2">
        {dirty ? (
          <>
            <TRNButton size="compact" onClick={syncJsonFromDraft}>
              <Undo2 size={13} strokeWidth={2} className="mr-1 inline" />
              Revert JSON
            </TRNButton>
            <TRNButton size="compact" onClick={() => discardDiagram(diagramId)}>
              Discard all
            </TRNButton>
            <TRNButton
              size="compact"
              className="border-amber-500/40 bg-amber-500/15"
              disabled={saving || parseError != null}
              onClick={() => void handleSave()}
            >
              <Save size={13} strokeWidth={2} className="mr-1 inline" />
              {saving ? "Saving…" : "Save diagram"}
            </TRNButton>
          </>
        ) : null}
      </div>

      {bindingPaths.length > 0 ? (
        <TRNFormField id={`${diagramId}-bindings`} label="Live bindings">
          <ul className="space-y-1 text-2xs text-zinc-400">
            {bindingPaths.map((path) => (
              <li key={path}>
                <span className="font-medium text-zinc-200">{path}</span>
                <span className="text-zinc-500"> — {catalogLabelForPath(path)}</span>
              </li>
            ))}
          </ul>
        </TRNFormField>
      ) : null}

      <TRNFormField id={`${diagramId}-catalog`} label="Binding catalog">
        <div className="scrollbar-hide max-h-24 overflow-y-auto text-2xs text-zinc-500">
          {DIAGRAM_BINDING_CATALOG.map((entry) => (
            <div key={entry.id}>
              {entry.id} · {entry.label}
              {entry.unit ? ` (${entry.unit})` : ""}
            </div>
          ))}
        </div>
      </TRNFormField>

      <TRNFormField
        id={`${diagramId}-json`}
        label="diagram.v1.json (advanced)"
        error={parseError ?? undefined}
      >
        <div data-course-diagram-json-input>
          <TRNHighlightedJsonTextarea
            aria-label="Diagram JSON"
            className="min-h-48"
            value={jsonText}
            onChange={handleJsonChange}
          />
        </div>
      </TRNFormField>
    </div>
  );

  if (embedded) {
    return (
      <TRNFormSection title={`Diagram · ${diagramId}`} showHeading={false} className="border-0 bg-transparent p-0">
        {body}
      </TRNFormSection>
    );
  }

  return (
    <div className="flex flex-col gap-3 border-t border-[var(--surface-border)] pt-4">
      <TRNFormSection title="Diagram editor" showHeading={false}>
        {body}
      </TRNFormSection>
    </div>
  );
}
