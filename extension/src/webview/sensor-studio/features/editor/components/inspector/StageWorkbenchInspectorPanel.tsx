import { Box, Cable, MonitorPlay, Move3d } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { WorkbenchVerticalSplit } from "../../../../../ui/workbench/WorkbenchVerticalSplit";
import type { NodeCatalogEntry } from "../../../../core/config/config-types";
import type { SceneObjectRefV1 } from "../../../../core/stage/scene-object-ref";
import { resolveStageObjectInspectorLabels } from "../../../../core/stage/stage-scene-object-inspector-labels";
import {
  TRNTabs,
  TRNTabsList,
  TRNTabsTrigger,
  TRN_INSPECTOR_TAB_BAR_WRAP_CLASS,
  TRN_INSPECTOR_TAB_LIST_CLASS,
  TRN_INSPECTOR_TAB_TRIGGER_CLASS,
  TRN_INSPECTOR_TAB_ACTIVE_CLASS,
} from "../../../../../ui/TRN";
import type { StagePresentationPreferences } from "../../../stage/stage-presentation-preferences";
import type { FlowGraphNode, StudioNode } from "../../store/flow-editor.store";
import { isScene3dInspectorNodeId } from "../../nodes/scene3d/scene3d-inspector-node-ids";
import { NodeInspectorNodeTab } from "./NodeInspectorNodeTab";
import { StageInspectorPanel } from "./StageInspectorPanel";
import { StageObjectInspectorPanel } from "./StageObjectInspectorPanel";
import { StageSelectionInspectorStrip } from "./StageSelectionInspectorStrip";
import {
  readStoredStageWorkbenchFlowSplitRatio,
  readStoredStageWorkbenchInspectorTab,
  writeStoredStageWorkbenchFlowSplitRatio,
  writeStoredStageWorkbenchInspectorTab,
  type StageWorkbenchInspectorTab,
} from "./stage-inspector-ui-persistence";

export type StageWorkbenchInspectorPanelProps = {
  selectedSceneObject: SceneObjectRefV1 | null;
  boundNode: StudioNode | null;
  flowPaneNode: StudioNode | null;
  /** True when the flow pane shows an explicit graph selection (not only the Stage binding). */
  flowPaneFromCanvasSelection: boolean;
  catalogEntry: NodeCatalogEntry | undefined;
  flowCatalogEntry: NodeCatalogEntry | undefined;
  flowNodes: readonly FlowGraphNode[];
  flowEdges: readonly import("@xyflow/react").Edge[];
  stagePresentationPreferences: StagePresentationPreferences;
  onStagePresentationPreferencesChange: (
    patch: Partial<StagePresentationPreferences>,
  ) => void;
  onFocusSelectionInGraph: () => void;
  onClearSelection: () => void;
  onSelectFlowNode: (nodeId: string) => void;
  onUpdateConfigField: (key: string, value: unknown) => boolean;
  onUpdateLabel: (nextLabel: string) => void;
  onUpdateNodeUiAllowBodyCollapse: (allow: boolean) => void;
  onUpdateConfigJson: (
    nextJson: string,
  ) => { ok: true } | { ok: false; message: string };
  jsonDraft: string;
  setJsonDraft: (next: string) => void;
  jsonError: string | null;
  setJsonError: (next: string | null) => void;
  sourceKeyDraft: string;
  setSourceKeyDraft: (next: string) => void;
  sourceKeyFieldError: string | null;
  setSourceKeyFieldError: (next: string | null) => void;
};

const WORKBENCH_TABS: readonly {
  id: StageWorkbenchInspectorTab;
  label: string;
  Icon: typeof Box;
}[] = [
  { id: "selection", label: "Selection", Icon: Box },
  { id: "scene", label: "Scene", Icon: MonitorPlay },
];

export function StageWorkbenchInspectorPanel(props: StageWorkbenchInspectorPanelProps) {
  const {
    selectedSceneObject,
    boundNode,
    flowPaneNode,
    flowPaneFromCanvasSelection,
    catalogEntry,
    flowCatalogEntry,
    flowNodes,
    flowEdges,
    stagePresentationPreferences,
    onStagePresentationPreferencesChange,
    onFocusSelectionInGraph,
    onClearSelection,
    onSelectFlowNode,
    onUpdateLabel,
    onUpdateNodeUiAllowBodyCollapse,
    onUpdateConfigJson,
    jsonDraft,
    setJsonDraft,
    jsonError,
    setJsonError,
    sourceKeyDraft,
    setSourceKeyDraft,
    sourceKeyFieldError,
    setSourceKeyFieldError,
  } = props;

  const [activeTab, setActiveTab] = useState<StageWorkbenchInspectorTab>(() =>
    readStoredStageWorkbenchInspectorTab(),
  );

  const setActiveTabPersisted = useCallback((next: StageWorkbenchInspectorTab) => {
    setActiveTab(next);
    writeStoredStageWorkbenchInspectorTab(next);
  }, []);

  useEffect(() => {
    if (selectedSceneObject != null) {
      setActiveTabPersisted("selection");
    }
  }, [selectedSceneObject, setActiveTabPersisted]);

  const flowHasScene3dInspector =
    flowPaneNode != null && isScene3dInspectorNodeId(flowPaneNode.data.nodeId);

  const showObjectPane =
    selectedSceneObject != null && !flowPaneFromCanvasSelection;

  const objectLabels = useMemo(() => {
    if (selectedSceneObject == null) {
      return null;
    }
    return resolveStageObjectInspectorLabels({
      selection: selectedSceneObject,
      boundNode,
      nodes: flowNodes,
      edges: flowEdges,
      boundCatalogTitle: catalogEntry?.title ?? "",
    });
  }, [boundNode, catalogEntry?.title, flowEdges, flowNodes, selectedSceneObject]);

  const selectionEmptyCopy = useMemo(() => {
    if (selectedSceneObject == null) {
      return "Click a mesh or model in the Stage viewport to inspect transforms and materials here.";
    }
    if (boundNode == null) {
      return "The bound flow node for this Stage object is missing from the graph.";
    }
    return null;
  }, [boundNode, selectedSceneObject]);

  const secondaryHint = useMemo(() => {
    if (showObjectPane && objectLabels != null) {
      return `Transform, material, and geometry for ${objectLabels.objectTitle}.`;
    }
    if (flowPaneNode == null) {
      return "Pick an object on Stage, or select a flow node on the graph.";
    }
    return "Flow node inspector — graph wiring and node chrome.";
  }, [flowPaneNode, objectLabels, showObjectPane]);

  const stageTabs = (
    <TRNTabs
      value={activeTab}
      onValueChange={(next) => setActiveTabPersisted(next as StageWorkbenchInspectorTab)}
      className="flex min-h-0 min-w-0 flex-1 flex-col"
      activeTriggerClassName={TRN_INSPECTOR_TAB_ACTIVE_CLASS}
    >
      <div className={TRN_INSPECTOR_TAB_BAR_WRAP_CLASS}>
        <TRNTabsList className={TRN_INSPECTOR_TAB_LIST_CLASS}>
          {WORKBENCH_TABS.map(({ id, label, Icon }) => (
            <TRNTabsTrigger key={id} value={id} className={TRN_INSPECTOR_TAB_TRIGGER_CLASS}>
              <Icon className="h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />
              {label}
            </TRNTabsTrigger>
          ))}
        </TRNTabsList>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {activeTab === "selection" ? (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {selectedSceneObject != null ? (
              <div className="shrink-0 px-2.5 pt-2">
                <StageSelectionInspectorStrip
                  selection={selectedSceneObject}
                  objectTitle={objectLabels?.objectTitle}
                  objectSubtitle={objectLabels?.objectSubtitle}
                  nodes={flowNodes}
                  edges={flowEdges}
                  onFocusInGraph={onFocusSelectionInGraph}
                  onClearSelection={onClearSelection}
                />
              </div>
            ) : null}
            {selectionEmptyCopy != null ? (
              <p className="px-2.5 py-3 text-[11px] leading-relaxed text-zinc-500">
                {selectionEmptyCopy}
              </p>
            ) : null}
          </div>
        ) : null}

        {activeTab === "scene" ? (
          <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
            <StageInspectorPanel
              embedded
              stagePresentationPreferences={stagePresentationPreferences}
              onStagePresentationPreferencesChange={onStagePresentationPreferencesChange}
            />
          </div>
        ) : null}
      </div>
    </TRNTabs>
  );

  const secondaryPane = showObjectPane ? (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <p className="shrink-0 border-b border-zinc-800/70 px-2.5 py-1.5 text-[10px] leading-snug text-zinc-500">
        {secondaryHint}
      </p>
      <div className="scrollbar-hide flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-2.5 pb-3 pt-1">
        <StageObjectInspectorPanel
          selection={selectedSceneObject!}
          boundNode={boundNode}
          boundCatalogTitle={catalogEntry?.title ?? ""}
          nodes={flowNodes as StudioNode[]}
          edges={flowEdges}
          onSelectFlowNode={onSelectFlowNode}
        />
      </div>
    </div>
  ) : (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <p className="shrink-0 border-b border-zinc-800/70 px-2.5 py-1.5 text-[10px] leading-snug text-zinc-500">
        {secondaryHint}
      </p>
      {flowPaneNode != null ? (
        <div className="scrollbar-hide flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-2.5 pb-3 pt-1">
          <NodeInspectorNodeTab
            selectedNode={flowPaneNode}
            catalogDefinitionTitle={flowCatalogEntry?.title ?? ""}
            hasScene3dInspector={flowHasScene3dInspector}
            presentation="flow"
            onUpdateLabel={onUpdateLabel}
            onUpdateNodeUiAllowBodyCollapse={onUpdateNodeUiAllowBodyCollapse}
            onUpdateConfigField={props.onUpdateConfigField}
            onUpdateConfigJson={onUpdateConfigJson}
            jsonDraft={jsonDraft}
            setJsonDraft={setJsonDraft}
            jsonError={jsonError}
            setJsonError={setJsonError}
            sourceKeyDraft={sourceKeyDraft}
            setSourceKeyDraft={setSourceKeyDraft}
            sourceKeyFieldError={sourceKeyFieldError}
            setSourceKeyFieldError={setSourceKeyFieldError}
          />
        </div>
      ) : null}
    </div>
  );

  const secondaryHeader = showObjectPane ? (
    <div className="flex shrink-0 items-center gap-1.5 border-b border-zinc-800/80 px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
      <Move3d className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
      Object
      {objectLabels != null ? (
        <span className="truncate font-normal normal-case text-zinc-500">
          · {objectLabels.objectTitle}
        </span>
      ) : null}
    </div>
  ) : (
    <div className="flex shrink-0 items-center gap-1.5 border-b border-zinc-800/80 px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
      <Cable className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
      Flow
      {flowPaneNode != null ? (
        <span className="truncate font-normal normal-case text-zinc-500">
          · {flowPaneNode.data.label || flowPaneNode.data.nodeId}
        </span>
      ) : null}
    </div>
  );

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-zinc-700/55 bg-zinc-950/45">
      <div className="shrink-0 border-b border-zinc-800/70 px-2.5 pb-1.5 pt-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-200/95">
          <MonitorPlay className="h-3.5 w-3.5 shrink-0 text-violet-400/90" aria-hidden />
          3D Scene
        </div>
        <p className="mt-1 text-[10px] leading-snug text-zinc-500">
          Stage selection above; object properties or flow wiring below (drag the splitter).
        </p>
      </div>

      <WorkbenchVerticalSplit
        readPrimaryRatio={readStoredStageWorkbenchFlowSplitRatio}
        writePrimaryRatio={writeStoredStageWorkbenchFlowSplitRatio}
        primary={stageTabs}
        secondaryHeader={secondaryHeader}
        secondary={secondaryPane}
      />
    </div>
  );
}
