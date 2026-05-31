import type { Edge } from "@xyflow/react";
import { Import, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { TRNButton, TRNSelect } from "../../../../../ui/TRN";
import type { StudioDemoTemplateId, StudioNode } from "../../store/flow-editor.store";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { CANVAS_DEMO_TEMPLATE_OPTIONS } from "./canvas-inspector-demo-templates";
import { CanvasInspectorStatCell } from "./CanvasInspectorStatCell";
import { InspectorPropertyRow } from "./InspectorPropertyRow";
import { InspectorSection } from "./InspectorSection";

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

  return (
    <div className="space-y-2">
      <InspectorSection title="Document summary" hint="Counts for the current flow graph.">
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
      </InspectorSection>

      <InspectorSection
        title="Starter graph"
        hint="Replace the canvas with a built-in demo template."
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
      </InspectorSection>

      <InspectorSection title="Import & export" hint="Flow JSON includes nodes, edges, viewport, and canvas prefs.">
        <div className="flex flex-wrap gap-1.5">
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
      </InspectorSection>
    </div>
  );
}
