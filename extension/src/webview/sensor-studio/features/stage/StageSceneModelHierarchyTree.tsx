import { ChevronDown, ChevronRight } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { TRNHintText } from "../../../ui/TRN";
import {
  buildDefaultExpandedPaths,
  flattenVisibleHierarchy,
} from "../editor/model-outliner/model-outliner-hierarchy-nav";
import {
  modelOutlinerTreeRowClass,
  resolveSceneTreeNodeIcon,
} from "../editor/model-outliner/model-outliner-tree-chrome";
import { useStudioGltfExtraction } from "../editor/gltf/useStudioGltfExtraction";
import {
  isStageSceneOutlinerRowSelected,
  sceneObjectRefForStageModelEntry,
  type StageSceneOutlinerRowV1,
} from "../../core/stage/build-stage-scene-outliner-rows";
import type { StageSceneModelEntryV1 } from "../../core/stage/stage-scene-snapshot";
import type { SceneObjectRefV1 } from "../../core/stage/scene-object-ref";
import { StageOutlinerVisibilityButton } from "./StageOutlinerVisibilityButton";

type Props = {
  model: StageSceneModelEntryV1;
  modelIndex: number;
  selectedSceneObject: SceneObjectRefV1 | null;
  onSelectRow: (row: StageSceneOutlinerRowV1) => void;
};

export function StageSceneModelHierarchyTree(props: Props) {
  const { model, modelIndex, selectedSceneObject, onSelectRow } = props;
  const glbExtraction = useStudioGltfExtraction(model.modelUrl);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => new Set());

  const defaultExpanded = useMemo(() => {
    if (glbExtraction.state !== "ok" || glbExtraction.result == null) {
      return new Set<string>();
    }
    return buildDefaultExpandedPaths(glbExtraction.result.sceneTree, 1);
  }, [glbExtraction.result, glbExtraction.state]);

  const effectiveExpanded =
    expandedPaths.size > 0 ? expandedPaths : defaultExpanded;

  const flatRows = useMemo(() => {
    if (glbExtraction.state !== "ok" || glbExtraction.result == null) {
      return [];
    }
    return flattenVisibleHierarchy(
      glbExtraction.result.sceneTree,
      effectiveExpanded,
      "",
      "all",
      glbExtraction.result,
    );
  }, [effectiveExpanded, glbExtraction.result, glbExtraction.state]);

  const onToggleExpand = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const base = prev.size > 0 ? new Set(prev) : new Set(defaultExpanded);
      if (base.has(path)) {
        base.delete(path);
      } else {
        base.add(path);
      }
      return base;
    });
  }, [defaultExpanded]);

  const onSelectPath = useCallback(
    (objectPath: string) => {
      const sceneObjectRef = sceneObjectRefForStageModelEntry({
        sourceNodeId: model.sourceNodeId,
        modelIndex,
        objectPath,
      });
      onSelectRow({
        id: `model-part:${model.sourceNodeId}:${modelIndex}:${objectPath}`,
        label: objectPath.split("/").pop() ?? objectPath,
        subtitle: objectPath,
        kind: "model",
        sceneObjectRef,
        modelIndex,
      });
    },
    [model.sourceNodeId, modelIndex, onSelectRow],
  );

  if (glbExtraction.state === "loading") {
    return (
      <TRNHintText className="px-2 py-1.5">Loading GLB hierarchy…</TRNHintText>
    );
  }

  if (glbExtraction.state === "error") {
    return (
      <TRNHintText className="px-2 py-1.5 text-amber-500/90">
        Could not load hierarchy for this model.
      </TRNHintText>
    );
  }

  if (flatRows.length === 0) {
    return null;
  }

  return (
    <div className="mt-1 flex flex-col gap-0.5 border-l border-zinc-800/80 pl-1">
      {flatRows.map((row) => {
        const sceneObjectRef = sceneObjectRefForStageModelEntry({
          sourceNodeId: model.sourceNodeId,
          modelIndex,
          objectPath: row.path,
        });
        const outlinerRow: StageSceneOutlinerRowV1 = {
          id: `hierarchy:${model.sourceNodeId}:${row.path}`,
          label: row.node.label,
          subtitle: row.node.nodeType,
          kind: "model",
          sceneObjectRef,
          modelIndex,
        };
        const selected = isStageSceneOutlinerRowSelected(outlinerRow, selectedSceneObject);
        const NodeIcon = resolveSceneTreeNodeIcon(row.node);

        return (
          <div
            key={row.path}
            className="flex min-w-0 items-stretch gap-0.5"
            style={{ paddingLeft: row.depth * 8 }}
          >
            {row.hasChildren ? (
              <button
                type="button"
                className="flex size-5 shrink-0 items-center justify-center rounded text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-200"
                aria-label={row.expanded ? "Collapse" : "Expand"}
                onClick={() => onToggleExpand(row.path)}
              >
                {row.expanded ? (
                  <ChevronDown className="size-3" aria-hidden />
                ) : (
                  <ChevronRight className="size-3" aria-hidden />
                )}
              </button>
            ) : (
              <span className="size-5 shrink-0" aria-hidden />
            )}
            <button
              type="button"
              className={`min-w-0 flex-1 ${modelOutlinerTreeRowClass(selected, false)}`}
              onClick={() => onSelectPath(row.path)}
            >
              <NodeIcon className="size-3 shrink-0 text-zinc-500" aria-hidden />
              <span className="min-w-0 truncate">{row.node.label}</span>
            </button>
            <StageOutlinerVisibilityButton sceneObjectRef={sceneObjectRef} />
          </div>
        );
      })}
    </div>
  );
}
