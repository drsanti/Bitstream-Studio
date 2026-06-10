import { TRNHintText } from "../../ui/TRN/TRNHintText";
import type { Diagram3dNodeV1 } from "../schemas/diagram.v1";
import { CourseInspectorCard, COURSE_INSPECTOR_CARD_ICON_CLASS } from "./CourseInspectorCard";
import { Layers3 } from "lucide-react";
import { useCourseDiagramEditorStore } from "./useCourseDiagramEditorStore";
import { getDiagram3dLayer } from "../schemas/normalizeDiagramV1";
import type { DiagramV1 } from "../schemas/diagram.v1";
import {
  resolveScene3dOutlinerSelectionVisual,
  type Scene3dSelectionAppearancePrefs,
} from "../runtime/diagram/diagram3dSelectionAppearance";
import { useCourseDiagram3dViewportPrefs } from "./useCourseDiagram3dViewportPrefs";

function OutlinerRows({
  nodes,
  depth,
  diagramId,
  selectedNodeId,
}: {
  nodes: Diagram3dNodeV1[];
  depth: number;
  diagramId: string;
  selectedNodeId: string | null;
  selectionAppearance: Scene3dSelectionAppearancePrefs;
}) {
  const setSelected3dNodeId = useCourseDiagramEditorStore((s) => s.setSelected3dNodeId);

  return nodes.map((node) => {
    const selected = selectedNodeId === node.id;
    const rowVisual = resolveScene3dOutlinerSelectionVisual(
      selectionAppearance,
      selected,
      selected,
      false,
    );
    const label =
      node.type === "group3d" ? `${node.id} · group` : `${node.id} · ${node.modelId}`;

    return (
      <li key={node.id}>
        <button
          type="button"
          className={rowVisual.className}
          style={{ paddingLeft: `${8 + depth * 12}px`, paddingRight: "6px", ...rowVisual.style }}
          onClick={() => setSelected3dNodeId(diagramId, node.id)}
        >
          {label}
        </button>
        {node.type === "group3d" && node.children.length > 0 ? (
          <ul className="mt-0.5 space-y-0.5">
            <OutlinerRows
              nodes={node.children}
              depth={depth + 1}
              diagramId={diagramId}
              selectedNodeId={selectedNodeId}
              selectionAppearance={selectionAppearance}
            />
          </ul>
        ) : null}
      </li>
    );
  });
}

export function CourseDiagram3dSceneOutliner({
  diagramId,
  diagram,
}: {
  diagramId: string;
  diagram: DiagramV1;
}) {
  const selectedNodeId = useCourseDiagramEditorStore(
    (s) => s.selected3dNodeIds[diagramId] ?? null,
  );
  const selectionAppearance = useCourseDiagram3dViewportPrefs((s) => s.selectionAppearance);
  const layer = getDiagram3dLayer(diagram);
  const roots = layer?.nodes ?? [];

  return (
    <CourseInspectorCard
      title="Scene outliner"
      hint="Hierarchy of 3D models and groups — syncs with viewport selection."
      titleIcon={<Layers3 className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
      defaultExpanded
    >
      {roots.length === 0 ? (
        <TRNHintText className="!text-[10px]">No 3D nodes yet — use Shift+A to add objects.</TRNHintText>
      ) : (
        <ul className="space-y-0.5">
          <OutlinerRows
            nodes={roots}
            depth={0}
            diagramId={diagramId}
            selectedNodeId={selectedNodeId}
            selectionAppearance={selectionAppearance}
          />
        </ul>
      )}
    </CourseInspectorCard>
  );
}
