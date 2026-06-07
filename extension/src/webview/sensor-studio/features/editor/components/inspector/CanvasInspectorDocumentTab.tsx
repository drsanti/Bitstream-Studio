import type { Edge } from "@xyflow/react";
import { Import, Save, Trash2, VolumeX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { TRNButton, TRNSelect } from "../../../../../ui/TRN";
import type { StudioDemoTemplateId, StudioNode } from "../../store/flow-editor.store";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { CANVAS_DEMO_TEMPLATE_OPTIONS } from "./canvas-inspector-demo-templates";
import { CanvasInspectorStatCell } from "./CanvasInspectorStatCell";
import { InspectorPropertyRow } from "./InspectorPropertyRow";
import { CanvasInspectorCard } from "./CanvasInspectorCard";
import {
  DEFAULT_DOCUMENT_TAB_CARD_ORDER,
  mergeDocumentTabCardOrder,
  readDocumentTabCardCollapsed,
  readDocumentTabCardOrder,
  writeDocumentTabCardCollapsed,
  writeDocumentTabCardOrder,
  type CanvasInspectorDocumentTabCardId,
} from "./canvas-inspector-ui-persistence";

export type CanvasInspectorDocumentTabProps = {
  nodes: StudioNode[];
  edges: Edge[];
  selectionCount: number;
  templateId: StudioDemoTemplateId;
  onTemplateIdChange: (templateId: StudioDemoTemplateId) => void;
  onRunTemplate: () => void;
  onClearCanvas: () => void;
  onExportFlow: () => void;
  onImportFlowPick: () => void;
};

export function CanvasInspectorDocumentTab(props: CanvasInspectorDocumentTabProps) {
  const {
    nodes,
    edges,
    selectionCount,
    templateId,
    onTemplateIdChange,
    onRunTemplate,
    onClearCanvas,
    onExportFlow,
    onImportFlowPick,
  } = props;

  const undoDepth = useFlowEditorStore((s) => s.undoStack.length);
  const muteAllAudio = useFlowEditorStore((s) => s.muteAllAudio);
  const openSaveToLibraryDialog = useFlowEditorStore((s) => s.openSaveToLibraryDialog);

  const templateOptions = useMemo(
    () =>
      CANVAS_DEMO_TEMPLATE_OPTIONS.map((o) => ({
        value: o.value,
        label: o.label,
      })),
    [],
  );

  const activeTemplateHint =
    CANVAS_DEMO_TEMPLATE_OPTIONS.find((o) => o.value === templateId)?.hint ?? "";

  const onClearGraphConfirmed = () => {
    if (
      typeof window !== "undefined" &&
      !window.confirm("Clear the entire flow graph? This cannot be undone from the canvas.")
    ) {
      return;
    }
    onClearCanvas();
  };

  const visibleCardIds = useMemo(
    (): CanvasInspectorDocumentTabCardId[] => [...DEFAULT_DOCUMENT_TAB_CARD_ORDER],
    [],
  );
  const [cardOrder, setCardOrder] = useState<CanvasInspectorDocumentTabCardId[]>(() =>
    mergeDocumentTabCardOrder(readDocumentTabCardOrder(), visibleCardIds),
  );
  const [collapsedById, setCollapsedById] = useState<Record<CanvasInspectorDocumentTabCardId, boolean>>(
    () => readDocumentTabCardCollapsed(),
  );
  const [dragId, setDragId] = useState<CanvasInspectorDocumentTabCardId | null>(null);

  useEffect(() => {
    setCardOrder((prev) => mergeDocumentTabCardOrder(prev, visibleCardIds));
  }, [visibleCardIds]);

  const onDropCard = (targetId: CanvasInspectorDocumentTabCardId) => {
    if (dragId == null || dragId === targetId) {
      return;
    }
    setCardOrder((prev) => {
      const next = prev.filter((id) => id !== dragId);
      const targetIdx = next.indexOf(targetId);
      if (targetIdx < 0) {
        return prev;
      }
      next.splice(targetIdx, 0, dragId);
      writeDocumentTabCardOrder(next);
      return next;
    });
  };

  const setCardCollapsed = (id: CanvasInspectorDocumentTabCardId, collapsed: boolean) => {
    setCollapsedById((prev) => {
      const next = { ...prev, [id]: collapsed };
      writeDocumentTabCardCollapsed(next);
      return next;
    });
  };

  const cardsById: Record<CanvasInspectorDocumentTabCardId, JSX.Element> = {
    "document-summary": (
      <CanvasInspectorCard
        id="canvas-inspector-document-summary"
        title="Document summary"
        hint="Counts for the current flow graph."
        collapsible
        collapsed={collapsedById["document-summary"]}
        onCollapsedChange={(next) => setCardCollapsed("document-summary", next)}
      >
        <div className="grid grid-cols-2 gap-1.5">
          <CanvasInspectorStatCell label="Nodes" value={nodes.length} />
          <CanvasInspectorStatCell label="Edges" value={edges.length} />
          <CanvasInspectorStatCell
            label="Selected"
            value={selectionCount}
            emphasis={selectionCount > 0}
          />
          <CanvasInspectorStatCell label="Undo steps" value={undoDepth} />
        </div>
      </CanvasInspectorCard>
    ),
    "starter-graph": (
      <CanvasInspectorCard
        id="canvas-inspector-starter-graph"
        title="Starter graph"
        hint="Replace the canvas with a built-in demo template."
        collapsible
        collapsed={collapsedById["starter-graph"]}
        onCollapsedChange={(next) => setCardCollapsed("starter-graph", next)}
      >
        <InspectorPropertyRow
          label="Template"
          description={activeTemplateHint.length > 0 ? activeTemplateHint : undefined}
        >
          <TRNSelect
            value={templateId}
            options={templateOptions}
            ariaLabel="Demo flow template"
            size="sm"
            onValueChange={(next) => onTemplateIdChange(next as StudioDemoTemplateId)}
          />
        </InspectorPropertyRow>
        <div className="mt-2">
          <TRNButton
            size="compact"
            className="w-full"
            hint="Replace nodes and edges with the chosen template."
            onClick={() => onRunTemplate()}
          >
            Run template
          </TRNButton>
        </div>
      </CanvasInspectorCard>
    ),
    "audio-safety": (
      <CanvasInspectorCard
        id="canvas-inspector-audio-safety"
        title="Audio safety"
        hint="Silence all playback and monitoring on the canvas."
        collapsible
        collapsed={collapsedById["audio-safety"]}
        onCollapsedChange={(next) => setCardCollapsed("audio-safety", next)}
      >
        <TRNButton
          size="compact"
          className="w-full border-rose-900/45 text-rose-100/90"
          prefixIcon={<VolumeX className="h-3 w-3" aria-hidden />}
          hint="Turns off Gate on Audio Output, Oscillator, and File Player nodes and mutes all monitor paths immediately."
          onClick={() => muteAllAudio()}
        >
          Mute all audio
        </TRNButton>
      </CanvasInspectorCard>
    ),
    "import-export": (
      <CanvasInspectorCard
        id="canvas-inspector-import-export"
        title="Import & export"
        hint="Flow JSON includes nodes, edges, viewport, and canvas prefs."
        collapsible
        collapsed={collapsedById["import-export"]}
        onCollapsedChange={(next) => setCardCollapsed("import-export", next)}
      >
        <TRNButton
          size="compact"
          className="w-full"
          prefixIcon={<Save className="h-3 w-3" aria-hidden />}
          hint="Save the full canvas or current selection to the Saved library (Flows or Groups)."
          onClick={() => openSaveToLibraryDialog()}
        >
          Save to library
        </TRNButton>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <TRNButton
            size="compact"
            className="min-w-0 flex-1"
            prefixIcon={<Import className="h-3 w-3" aria-hidden />}
            hint="Load nodes, edges, viewport, and canvas preferences from JSON."
            onClick={onImportFlowPick}
          >
            Import JSON
          </TRNButton>
          <TRNButton
            size="compact"
            className="min-w-0 flex-1"
            hint="Download the current flow graph and canvas preferences as JSON."
            onClick={onExportFlow}
          >
            Export JSON
          </TRNButton>
        </div>
        <div className="mt-2.5 border-t border-rose-950/40 pt-2.5">
          <TRNButton
            size="compact"
            className="w-full border-rose-900/45 text-rose-100/90"
            prefixIcon={<Trash2 className="h-3 w-3" aria-hidden />}
            hint="Remove all nodes and edges from the canvas."
            onClick={onClearGraphConfirmed}
          >
            Clear graph
          </TRNButton>
        </div>
      </CanvasInspectorCard>
    ),
  };

  return (
    <div className="space-y-2">
      {cardOrder.map((id) => (
        <div
          key={id}
          className="min-w-0"
          draggable
          onDragStart={(e) => {
            const header = (e.target as HTMLElement | null)?.closest?.("[data-trn-card-header]");
            if (header == null) {
              e.preventDefault();
              return;
            }
            setDragId(id);
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", id);
          }}
          onDragEnd={() => setDragId(null)}
          onDragOver={(e) => {
            if (dragId == null || dragId === id) {
              return;
            }
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
          }}
          onDrop={(e) => {
            e.preventDefault();
            onDropCard(id);
          }}
        >
          {cardsById[id]}
        </div>
      ))}
    </div>
  );
}
