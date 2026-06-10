import { GripVertical, Layers3 } from "lucide-react";
import { useCallback, useState } from "react";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import type { Diagram3dNodeV1 } from "../schemas/diagram.v1";
import type { SceneV1 } from "../schemas/scene.v1";
import {
  findDiagram3dNode,
  group3dContainsNodeId,
} from "../runtime/diagram/diagram3dNodeMutations";
import { sceneV1ToDiagramV1 } from "../runtime/scene/sceneDiagramBridge";
import { resolveScene3dOutlinerSelectionVisual } from "../runtime/diagram/diagram3dSelectionAppearance";
import { CourseInspectorCard, COURSE_INSPECTOR_CARD_ICON_CLASS } from "./CourseInspectorCard";
import { useSceneNodeSelection } from "./useSceneNodeSelection";
import { useCourseSceneEditorStore } from "./useCourseSceneEditorStore";
import { useCourseDiagram3dViewportPrefs } from "./useCourseDiagram3dViewportPrefs";

import type { Scene3dSelectionAppearancePrefs } from "../runtime/diagram/diagram3dSelectionAppearance";

function canReparentNode(
  diagram: ReturnType<typeof sceneV1ToDiagramV1>,
  nodeId: string,
  parentGroupId: string | null,
): boolean {
  if (nodeId === parentGroupId) {
    return false;
  }
  if (parentGroupId == null) {
    return true;
  }
  const target = findDiagram3dNode(diagram, parentGroupId);
  if (target?.type !== "group3d") {
    return false;
  }
  const moving = findDiagram3dNode(diagram, nodeId);
  if (moving?.type === "group3d") {
    if (parentGroupId === nodeId || group3dContainsNodeId(moving, parentGroupId)) {
      return false;
    }
  }
  return true;
}

function OutlinerRows({
  nodes,
  depth,
  scene,
  selectedNodeIds,
  activeNodeId,
  dragNodeId,
  dropTargetId,
  onPickNode,
  onDragNode,
  onDropOnTarget,
  onCommitDrop,
  onDragEnd,
  selectionAppearance,
}: {
  nodes: Diagram3dNodeV1[];
  depth: number;
  scene: SceneV1;
  selectedNodeIds: string[];
  activeNodeId: string | null;
  dragNodeId: string | null;
  dropTargetId: string | null;
  onPickNode: (nodeId: string, extend: boolean) => void;
  onDragNode: (nodeId: string) => void;
  onDropOnTarget: (targetId: string | null) => void;
  onCommitDrop: (targetId: string | null) => void;
  onDragEnd: () => void;
  selectionAppearance: Scene3dSelectionAppearancePrefs;
}) {
  const diagram = sceneV1ToDiagramV1(scene);

  return nodes.map((node) => {
    const selected = selectedNodeIds.includes(node.id);
    const active = activeNodeId === node.id;
    const isGroup = node.type === "group3d";
    const label = isGroup ? `${node.id} · group` : `${node.id} · ${node.modelId}`;
    const isDropTarget = dropTargetId === node.id && isGroup;
    const rowVisual = resolveScene3dOutlinerSelectionVisual(
      selectionAppearance,
      selected,
      active,
      isDropTarget,
    );

    return (
      <li key={node.id}>
        <div
          className={rowVisual.className}
          style={{ paddingLeft: `${6 + depth * 12}px`, paddingRight: "6px", ...rowVisual.style }}
          onDragOver={
            isGroup
              ? (event) => {
                  if (dragNodeId == null || !canReparentNode(diagram, dragNodeId, node.id)) {
                    return;
                  }
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  onDropOnTarget(node.id);
                }
              : undefined
          }
          onDragLeave={() => {
            if (dropTargetId === node.id) {
              onDropOnTarget(null);
            }
          }}
          onDrop={
            isGroup
              ? (event) => {
                  event.preventDefault();
                  if (dragNodeId != null && canReparentNode(diagram, dragNodeId, node.id)) {
                    onCommitDrop(node.id);
                  }
                  onDragEnd();
                }
              : undefined
          }
        >
          <span
            draggable
            className="cursor-grab text-zinc-600 active:cursor-grabbing"
            aria-hidden
            onDragStart={(event) => {
              event.dataTransfer.setData("text/plain", node.id);
              event.dataTransfer.effectAllowed = "move";
              onDragNode(node.id);
            }}
            onDragEnd={onDragEnd}
          >
            <GripVertical className="h-3 w-3" />
          </span>
          <button
            type="button"
            className="min-w-0 flex-1 truncate text-left"
            onClick={(event) => onPickNode(node.id, event.shiftKey)}
          >
            {label}
          </button>
          {rowVisual.showActiveBadge ? (
            <span
              className="mr-1 shrink-0 text-[9px] font-semibold uppercase tracking-wide"
              style={{ color: selectionAppearance.active.color }}
            >
              active
            </span>
          ) : null}
        </div>
        {isGroup && node.children.length > 0 ? (
          <ul className="mt-0.5 space-y-0.5">
            <OutlinerRows
              nodes={node.children}
              depth={depth + 1}
              scene={scene}
              selectedNodeIds={selectedNodeIds}
              activeNodeId={activeNodeId}
              dragNodeId={dragNodeId}
              dropTargetId={dropTargetId}
              onPickNode={onPickNode}
              onDragNode={onDragNode}
              onDropOnTarget={onDropOnTarget}
              onCommitDrop={onCommitDrop}
              onDragEnd={onDragEnd}
              selectionAppearance={selectionAppearance}
            />
          </ul>
        ) : null}
      </li>
    );
  });
}

export function CourseSceneOutliner({
  documentId,
  scene,
}: {
  documentId: string;
  scene: SceneV1;
}) {
  const { selectedNodeIds, activeNodeId, pickSceneNode } = useSceneNodeSelection(documentId);
  const moveNodes = useCourseSceneEditorStore((s) => s.moveNodes);
  const selectionAppearance = useCourseDiagram3dViewportPrefs((s) => s.selectionAppearance);
  const [dragNodeId, setDragNodeId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const commitDrop = useCallback(
    (targetId: string | null) => {
      if (dragNodeId == null) {
        return;
      }
      const base = selectedNodeIds.includes(dragNodeId) ? selectedNodeIds : [dragNodeId];
      const idsToMove =
        targetId != null ? base.filter((id) => id !== targetId) : base;
      if (idsToMove.length === 0) {
        return;
      }
      moveNodes(documentId, idsToMove, targetId, { recordUndo: true });
    },
    [documentId, dragNodeId, moveNodes, selectedNodeIds],
  );

  const roots = scene.nodes;
  const rootDropActive = dropTargetId === "__root__";
  const rootRowVisual = resolveScene3dOutlinerSelectionVisual(
    selectionAppearance,
    false,
    false,
    rootDropActive,
  );

  return (
    <CourseInspectorCard
      title="Scene outliner"
      hint="Drag onto a group to reparent. Amber row = active (gizmo target); sky = selected."
      titleIcon={<Layers3 className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
      defaultExpanded
    >
      {roots.length === 0 ? (
        <TRNHintText className="text-[10px]!">No 3D nodes yet — use Shift+A to add objects.</TRNHintText>
      ) : (
        <div className="flex flex-col gap-1">
          <div
            className={rootRowVisual.className}
            style={{ paddingLeft: "6px", paddingRight: "6px", ...rootRowVisual.style }}
            onDragOver={(event) => {
              if (dragNodeId == null) {
                return;
              }
              event.preventDefault();
              setDropTargetId("__root__");
            }}
            onDragLeave={() => {
              if (dropTargetId === "__root__") {
                setDropTargetId(null);
              }
            }}
            onDrop={(event) => {
              event.preventDefault();
              commitDrop(null);
              setDragNodeId(null);
              setDropTargetId(null);
            }}
          >
            <span className="w-3 shrink-0" aria-hidden />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Scene root
            </span>
          </div>
          <ul className="space-y-0.5">
            <OutlinerRows
              nodes={roots}
              depth={0}
              scene={scene}
              selectedNodeIds={selectedNodeIds}
              activeNodeId={activeNodeId}
              dragNodeId={dragNodeId}
              dropTargetId={dropTargetId}
              onPickNode={(nodeId, extend) => pickSceneNode(nodeId, extend)}
              onDragNode={setDragNodeId}
              onDropOnTarget={setDropTargetId}
              onCommitDrop={commitDrop}
              onDragEnd={() => {
                setDragNodeId(null);
                setDropTargetId(null);
              }}
              selectionAppearance={selectionAppearance}
            />
          </ul>
        </div>
      )}
    </CourseInspectorCard>
  );
}
