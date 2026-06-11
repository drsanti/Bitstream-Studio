import { Box, Cuboid, Focus, Layers, MonitorPlay, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TRNButton, TRNHintText, TRNInlineToggleRow, TRNInput } from "../../../ui/TRN";
import {
  buildStageSceneOutlinerRows,
  isStageSceneOutlinerRowSelected,
  stageSceneOutlinerRowMatchesSearch,
  type StageSceneOutlinerRowV1,
} from "../../core/stage/build-stage-scene-outliner-rows";
import { flowNodeIdsForSceneObjectRef } from "../../core/stage/scene-object-ref";
import { useStageSceneStore } from "../../state/stage-scene.store";
import { useStudioWorkbenchFocusStore } from "../../state/studio-workbench-focus.store";
import { useFlowEditorStore } from "../editor/store/flow-editor.store";
import { StageSceneModelHierarchyTree } from "./StageSceneModelHierarchyTree";
import { useStudioWorkbenchShell } from "../editor/workbench/studio-workbench-context";
import { ModelOutlinerCollapsibleBlock } from "../editor/model-outliner/ModelOutlinerCollapsibleBlock";
import {
  readStoredStageOutlinerFollowStagePick,
  writeStoredStageOutlinerFollowStagePick,
} from "./stage-outliner-ui-persistence";
import { StageOutlinerVisibilityButton } from "./StageOutlinerVisibilityButton";

function rowIcon(row: StageSceneOutlinerRowV1) {
  if (row.kind === "scene-output") {
    return MonitorPlay;
  }
  if (row.kind === "model") {
    return Layers;
  }
  if (row.kind === "mesh") {
    return Box;
  }
  return Cuboid;
}

function OutlinerRow(props: {
  row: StageSceneOutlinerRowV1;
  selected: boolean;
  onSelect: (row: StageSceneOutlinerRowV1) => void;
}) {
  const { row, selected, onSelect } = props;
  const Icon = rowIcon(row);
  const selectable = row.sceneObjectRef != null || row.focusFlowNodeId != null;

  return (
    <div className="flex min-w-0 items-stretch gap-0.5">
      <button
        type="button"
        disabled={!selectable}
        className={`flex min-w-0 flex-1 items-start gap-2 rounded-md border px-2 py-1.5 text-left transition-colors ${
          selected
            ? "border-violet-700/55 bg-violet-950/35"
            : selectable
              ? "border-transparent hover:border-zinc-700/60 hover:bg-zinc-900/55"
              : "cursor-default border-transparent opacity-80"
        }`}
        onClick={() => {
          if (selectable) {
            onSelect(row);
          }
        }}
      >
        <Icon
          className={`mt-0.5 size-3.5 shrink-0 ${selected ? "text-violet-300/90" : "text-zinc-500"}`}
          aria-hidden
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[11px] font-medium text-zinc-100">{row.label}</span>
          {row.subtitle != null ? (
            <span className="mt-0.5 block truncate text-[10px] text-zinc-500">{row.subtitle}</span>
          ) : null}
        </span>
      </button>
      {row.sceneObjectRef != null ? (
        <StageOutlinerVisibilityButton sceneObjectRef={row.sceneObjectRef} />
      ) : null}
    </div>
  );
}

/** SE6 — committed Stage objects (models + procedural meshes), synced with viewport selection. */
export function StageSceneOutlinerPanel() {
  const snapshot = useStageSceneStore((s) => s.snapshot);
  const selectedSceneObject = useStageSceneStore((s) => s.selectedSceneObject);
  const lastViewportPick = useStageSceneStore((s) => s.lastViewportPick);
  const setSelectedSceneObject = useStageSceneStore((s) => s.setSelectedSceneObject);
  const setPrimaryModelIndex = useStageSceneStore((s) => s.setPrimaryModelIndex);
  const setActiveEditorType = useStudioWorkbenchFocusStore((s) => s.setActiveEditorType);
  const selectStudioNodesByIds = useFlowEditorStore((s) => s.selectStudioNodesByIds);
  const fitFlowCanvasToNodeIds = useFlowEditorStore((s) => s.fitFlowCanvasToNodeIds);
  const { onFocusWorkbenchPane } = useStudioWorkbenchShell();

  const [searchQuery, setSearchQuery] = useState("");
  const [followStagePick, setFollowStagePick] = useState(() =>
    readStoredStageOutlinerFollowStagePick(),
  );

  const rows = useMemo(
    () =>
      buildStageSceneOutlinerRows({
        snapshot,
        lastViewportPick,
        selectedSceneObject,
      }),
    [lastViewportPick, selectedSceneObject, snapshot],
  );

  const filteredRows = useMemo(
    () => rows.filter((row) => stageSceneOutlinerRowMatchesSearch(row, searchQuery)),
    [rows, searchQuery],
  );

  const sceneOutputRow = filteredRows.find((r) => r.kind === "scene-output") ?? null;
  const modelRows = useMemo(
    () => filteredRows.filter((r) => r.kind === "model"),
    [filteredRows],
  );
  const meshRows = useMemo(
    () => filteredRows.filter((r) => r.kind === "mesh"),
    [filteredRows],
  );
  const pickRows = useMemo(
    () => filteredRows.filter((r) => r.kind === "pick"),
    [filteredRows],
  );

  const onSelectRow = useCallback(
    (row: StageSceneOutlinerRowV1) => {
      if (row.focusFlowNodeId != null) {
        selectStudioNodesByIds([row.focusFlowNodeId]);
        fitFlowCanvasToNodeIds([row.focusFlowNodeId]);
        setActiveEditorType("flow");
        onFocusWorkbenchPane?.("flow");
        return;
      }
      if (row.sceneObjectRef == null) {
        return;
      }
      setSelectedSceneObject(row.sceneObjectRef);
      if (row.modelIndex != null) {
        setPrimaryModelIndex(row.modelIndex);
      }
      const nodeIds = flowNodeIdsForSceneObjectRef(row.sceneObjectRef);
      selectStudioNodesByIds(nodeIds);
      fitFlowCanvasToNodeIds(nodeIds);
      setActiveEditorType("stage");
      onFocusWorkbenchPane?.("stage");
    },
    [
      fitFlowCanvasToNodeIds,
      onFocusWorkbenchPane,
      selectStudioNodesByIds,
      setActiveEditorType,
      setPrimaryModelIndex,
      setSelectedSceneObject,
    ],
  );

  const onFocusStage = useCallback(() => {
    setActiveEditorType("stage");
    onFocusWorkbenchPane?.("stage");
  }, [onFocusWorkbenchPane, setActiveEditorType]);

  useEffect(() => {
    if (!followStagePick || lastViewportPick == null) {
      return;
    }
    setSelectedSceneObject({
      kind: lastViewportPick.objectPath.startsWith("proc:") ? "procedural" : "glb-instance",
      sourceNodeId: lastViewportPick.sourceNodeId,
      objectPath: lastViewportPick.objectPath,
      modelIndex: lastViewportPick.modelIndex,
    });
    setPrimaryModelIndex(lastViewportPick.modelIndex);
  }, [followStagePick, lastViewportPick, setPrimaryModelIndex, setSelectedSceneObject]);

  const empty = snapshot.sceneOutputNodeId == null;

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden p-2">
      <div className="flex shrink-0 items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-zinc-100">Stage objects</p>
          <TRNHintText className="mt-0.5">
            Committed models and meshes from Scene Output — click to select on Stage.
          </TRNHintText>
        </div>
        <TRNButton variant="ghost" size="sm" className="!h-7 shrink-0 gap-1 px-2 text-[11px]" onClick={onFocusStage}>
          <Focus className="size-3.5 shrink-0" aria-hidden />
          Stage
        </TRNButton>
      </div>

      {!empty ? (
        <div className="flex shrink-0 flex-col gap-1.5">
          <TRNInput
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Filter objects…"
            size="sm"
            prefixIcon={Search}
            className="text-[11px]"
          />
          <TRNInlineToggleRow
            label="Follow Stage selection"
            hint="When enabled, viewport picks update this list selection."
            checked={followStagePick}
            onCheckedChange={(next) => {
              setFollowStagePick(next);
              writeStoredStageOutlinerFollowStagePick(next);
            }}
          />
        </div>
      ) : null}

      {empty ? (
        <div className="rounded-md border border-zinc-800/70 bg-zinc-950/40 px-2.5 py-3 text-[11px] leading-relaxed text-zinc-400">
          Add a <span className="text-zinc-200">Scene Output</span> node and wire models or meshes
          to populate this list.
        </div>
      ) : (
        <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          {sceneOutputRow != null ? (
            <ModelOutlinerCollapsibleBlock title="Commit" count={1} defaultExpanded>
              <OutlinerRow row={sceneOutputRow} selected={false} onSelect={onSelectRow} />
            </ModelOutlinerCollapsibleBlock>
          ) : null}

          {modelRows.length > 0 ? (
            <ModelOutlinerCollapsibleBlock title="Models" count={modelRows.length} defaultExpanded>
              <div className="flex flex-col gap-2">
                {modelRows.map((row) => {
                  const modelIndex = row.modelIndex ?? 0;
                  const model = snapshot.models[modelIndex];
                  if (model == null) {
                    return (
                      <OutlinerRow
                        key={row.id}
                        row={row}
                        selected={isStageSceneOutlinerRowSelected(row, selectedSceneObject)}
                        onSelect={onSelectRow}
                      />
                    );
                  }
                  return (
                    <div key={row.id} className="min-w-0">
                      <OutlinerRow
                        row={row}
                        selected={isStageSceneOutlinerRowSelected(row, selectedSceneObject)}
                        onSelect={onSelectRow}
                      />
                      <StageSceneModelHierarchyTree
                        model={model}
                        modelIndex={modelIndex}
                        selectedSceneObject={selectedSceneObject}
                        onSelectRow={onSelectRow}
                      />
                    </div>
                  );
                })}
              </div>
            </ModelOutlinerCollapsibleBlock>
          ) : null}

          {meshRows.length > 0 ? (
            <ModelOutlinerCollapsibleBlock title="Meshes" count={meshRows.length} defaultExpanded>
              <div className="flex flex-col gap-1">
                {meshRows.map((row) => (
                  <OutlinerRow
                    key={row.id}
                    row={row}
                    selected={isStageSceneOutlinerRowSelected(row, selectedSceneObject)}
                    onSelect={onSelectRow}
                  />
                ))}
              </div>
            </ModelOutlinerCollapsibleBlock>
          ) : null}

          {pickRows.length > 0 ? (
            <ModelOutlinerCollapsibleBlock title="Selection" count={pickRows.length} defaultExpanded>
              <div className="flex flex-col gap-1">
                {pickRows.map((row) => (
                  <OutlinerRow
                    key={row.id}
                    row={row}
                    selected={isStageSceneOutlinerRowSelected(row, selectedSceneObject)}
                    onSelect={onSelectRow}
                  />
                ))}
              </div>
            </ModelOutlinerCollapsibleBlock>
          ) : null}

          {modelRows.length === 0 && meshRows.length === 0 && pickRows.length === 0 && searchQuery.trim().length > 0 ? (
            <div className="rounded-md border border-zinc-800/70 bg-zinc-950/40 px-2.5 py-3 text-[11px] text-zinc-400">
              No objects match &ldquo;{searchQuery.trim()}&rdquo;.
            </div>
          ) : null}

          {modelRows.length === 0 && meshRows.length === 0 && pickRows.length === 0 && searchQuery.trim().length === 0 ? (
            <div className="rounded-md border border-zinc-800/70 bg-zinc-950/40 px-2.5 py-3 text-[11px] text-zinc-400">
              Scene Output is wired but has no committed models or meshes yet.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
