import { useCallback, useState } from "react";
import { applyStageScene3dPresentation } from "../../../../core/stage/stage-scene-defaults";
import type { Scene3DConfigV1 } from "../../../../core/scene3d/scene3d-config";
import { useStudioAssetDescriptors } from "../../../asset-browser/useStudioAssetDescriptors";
import { useStageSceneStore } from "../../../../state/stage-scene.store";
import {
  patchCommittedScene3d,
  patchStageSceneModelCatalogSelect,
} from "../../../stage/stage-viewport-helpers";
import { Rotation3DInspectorCards } from "../rotation/Rotation3DInspectorCards";
import { CanvasInspectorCard } from "./CanvasInspectorCard";
import {
  DEFAULT_STAGE_SCENE3D_CARD_ORDER,
  mergeStageScene3dCardOrder,
  readStageScene3dCardCollapsed,
  readStageScene3dCardOrder,
  STAGE_SCENE3D_CARD_HINTS,
  STAGE_SCENE3D_CARD_TITLES,
  writeStageScene3dCardCollapsed,
  writeStageScene3dCardOrder,
  type StageInspectorScene3dCardId,
} from "./stage-inspector-ui-persistence";

export function StageInspectorScene3dTab() {
  const { descriptors } = useStudioAssetDescriptors();
  const scene3dRaw = useStageSceneStore((s) => s.snapshot.scene3d);
  const wiredModels = useStageSceneStore((s) => s.snapshot.models);
  const hasSceneOutput = useStageSceneStore((s) => s.snapshot.sceneOutputNodeId) != null;

  const [cardOrder, setCardOrder] = useState<StageInspectorScene3dCardId[]>(() =>
    mergeStageScene3dCardOrder(readStageScene3dCardOrder(), DEFAULT_STAGE_SCENE3D_CARD_ORDER),
  );
  const [collapsedById, setCollapsedById] = useState(() => readStageScene3dCardCollapsed());
  const [dragId, setDragId] = useState<StageInspectorScene3dCardId | null>(null);

  const onChangeScene3d = useCallback((next: Scene3DConfigV1) => {
    patchCommittedScene3d((base, showGrid) => applyStageScene3dPresentation(next, { showGrid }));
  }, []);

  const onPickStudioModelCatalog = useCallback(
    (catalogId: string) => {
      patchStageSceneModelCatalogSelect(catalogId, descriptors);
    },
    [descriptors],
  );

  const modelCatalogHint =
    wiredModels.length > 0
      ? "Updates the Model Select node wired to Scene Output Models (Stage preview follows that wire)."
      : "Baked into Scene Output when no Models wire is connected.";

  const onDropCard = (targetId: StageInspectorScene3dCardId) => {
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
      writeStageScene3dCardOrder(next);
      return next;
    });
  };

  const setCardCollapsed = (id: StageInspectorScene3dCardId, collapsed: boolean) => {
    setCollapsedById((prev) => {
      const next = { ...prev, [id]: collapsed };
      writeStageScene3dCardCollapsed(next);
      return next;
    });
  };

  if (!hasSceneOutput) {
    return (
      <p className="text-[11px] leading-relaxed text-zinc-500">
        Add a <span className="text-zinc-400">Scene Output</span> node to edit renderer, camera,
        lights, and orbit settings here.
      </p>
    );
  }

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
          <CanvasInspectorCard
            id={`stage-inspector-scene3d-${id}`}
            title={STAGE_SCENE3D_CARD_TITLES[id]}
            hint={STAGE_SCENE3D_CARD_HINTS[id]}
            collapsible
            collapsed={collapsedById[id]}
            onCollapsedChange={(next) => setCardCollapsed(id, next)}
          >
            <Rotation3DInspectorCards
              chromeless
              singlePanel={id}
              scene3dRaw={scene3dRaw}
              onChangeScene3d={onChangeScene3d}
              onPickStudioModelCatalog={id === "model" ? onPickStudioModelCatalog : undefined}
              modelCatalogHint={id === "model" ? modelCatalogHint : undefined}
            />
          </CanvasInspectorCard>
        </div>
      ))}
    </div>
  );
}
