import { useCallback, useMemo, useState } from "react";
import {
  defaultScene3DConfig,
  persistScene3DConfig,
  type Scene3DConfigV1,
} from "../../../../core/scene3d/scene3d-config";
import type { StudioNode } from "../../store/flow-editor.store";
import { Scene3dInspectorCards } from "./scene3d/Scene3dInspectorCards";
import { CanvasInspectorCard } from "./CanvasInspectorCard";
import {
  DEFAULT_NODE_SCENE3D_CARD_ORDER,
  mergeNodeScene3dCardOrder,
  readNodeScene3dCardCollapsed,
  readNodeScene3dCardOrder,
  writeNodeScene3dCardCollapsed,
  writeNodeScene3dCardOrder,
  type Scene3dInspectorPanelId,
} from "./node-inspector-ui-persistence";
import {
  STAGE_SCENE3D_CARD_HINTS,
  STAGE_SCENE3D_CARD_TITLES,
} from "./stage-inspector-ui-persistence";

export type NodeInspectorScene3dSectionProps = {
  selectedNode: StudioNode;
  onUpdateConfigField: (key: string, value: unknown) => boolean;
  /** When set, only cards whose id is included are rendered (settings search). */
  visibleCardIds?: readonly Scene3dInspectorPanelId[];
};

function nodeScene3dModelCatalogHint(nodeId: string): string {
  if (nodeId === "model-viewer") {
    return "Edits this node's GLB preview on the flow canvas. The Stage workbench follows Scene Output wires, not this card.";
  }
  if (nodeId === "rotation-3d-euler" || nodeId === "rotation-3d-quaternion") {
    return "Preview rig for this rotation node. Wired inputs override live values on the canvas.";
  }
  return "Scene3D preview settings stored on this node's defaultConfig.";
}

export function NodeInspectorScene3dSection(props: NodeInspectorScene3dSectionProps) {
  const { selectedNode, onUpdateConfigField, visibleCardIds } = props;
  const catalogNodeId = selectedNode.data.nodeId;

  const [cardOrder, setCardOrder] = useState<Scene3dInspectorPanelId[]>(() =>
    mergeNodeScene3dCardOrder(readNodeScene3dCardOrder(), DEFAULT_NODE_SCENE3D_CARD_ORDER),
  );
  const [collapsedById, setCollapsedById] = useState(() => readNodeScene3dCardCollapsed());
  const [dragId, setDragId] = useState<Scene3dInspectorPanelId | null>(null);

  const cardsToRender = useMemo(() => {
    if (visibleCardIds == null) {
      return cardOrder;
    }
    if (visibleCardIds.length === 0) {
      return [];
    }
    const allowed = new Set(visibleCardIds);
    return cardOrder.filter((id) => allowed.has(id));
  }, [cardOrder, visibleCardIds]);

  const onChangeScene3d = useCallback(
    (next: Scene3DConfigV1) => {
      const snap = next != null ? persistScene3DConfig(next) : defaultScene3DConfig();
      onUpdateConfigField("scene3d", snap);
    },
    [onUpdateConfigField],
  );

  const modelCatalogHint = nodeScene3dModelCatalogHint(catalogNodeId);

  const onDropCard = (targetId: Scene3dInspectorPanelId) => {
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
      writeNodeScene3dCardOrder(next);
      return next;
    });
  };

  const setCardCollapsed = (id: Scene3dInspectorPanelId, collapsed: boolean) => {
    setCollapsedById((prev) => {
      const next = { ...prev, [id]: collapsed };
      writeNodeScene3dCardCollapsed(next);
      return next;
    });
  };

  if (cardsToRender.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="px-0.5 text-[10px] leading-snug text-zinc-500">
        Preview scene for this node — collapsible cards match the Stage Scene3D inspector layout.
      </p>
      {cardsToRender.map((id) => (
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
          <CanvasInspectorCard
            id={`node-inspector-scene3d-${id}`}
            title={STAGE_SCENE3D_CARD_TITLES[id]}
            hint={STAGE_SCENE3D_CARD_HINTS[id]}
            collapsible
            collapsed={collapsedById[id]}
            onCollapsedChange={(next) => setCardCollapsed(id, next)}
          >
            <Scene3dInspectorCards
              chromeless
              singlePanel={id}
              scene3dRaw={selectedNode.data.defaultConfig?.scene3d}
              onChangeScene3d={onChangeScene3d}
              modelCatalogHint={id === "model" ? modelCatalogHint : undefined}
            />
          </CanvasInspectorCard>
        </div>
      ))}
    </div>
  );
}
