import { Activity, Box, ClipboardList, Cpu, SlidersHorizontal, type LucideIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { NodeCatalogEntry } from "../../../core/config/config-types";
import { resolveStudioNodeSourceId } from "../../../core/device/resolve-studio-node-source-id";
import {
  TRNTabs,
  TRNTabsList,
  TRNTabsTrigger,
  TRN_INSPECTOR_TAB_BAR_WRAP_CLASS,
  TRN_INSPECTOR_TAB_LIST_CLASS,
  TRN_INSPECTOR_TAB_TRIGGER_CLASS,
  trnInspectorTabActiveClassName,
} from "../../../../ui/TRN";
import { isRotation3DCatalogNodeId } from "../nodes/rotation/rotation-3d-node-ids";
import type { StudioNode } from "../store/flow-editor.store";
import { NodeInspectorDetailsTab } from "./inspector/NodeInspectorDetailsTab";
import { NodeInspectorDeviceTab } from "./inspector/NodeInspectorDeviceTab";
import { InspectorContextBar } from "./inspector/InspectorContextBar";
import { NodeInspectorLiveTab } from "./inspector/NodeInspectorLiveTab";
import { NodeInspectorMultiLiveReadouts } from "./inspector/NodeInspectorMultiLiveReadouts";
import { NodeInspectorNodeTab } from "./inspector/NodeInspectorNodeTab";
import {
  CanvasInspectorPanel,
  type CanvasInspectorPanelProps,
} from "./inspector/CanvasInspectorPanel";
import {
  readStoredInspectorActiveTab,
  writeStoredInspectorActiveTab,
  type InspectorMainTab,
} from "./inspector/node-inspector-ui-persistence";

const CORE_INSPECTOR_TABS: readonly {
  id: InspectorMainTab;
  label: string;
  Icon: LucideIcon;
}[] = [
  { id: "details", label: "Details", Icon: ClipboardList },
  { id: "live", label: "Live", Icon: Activity },
  { id: "node", label: "Node", Icon: Box },
];

const DEVICE_INSPECTOR_TAB = {
  id: "device" as const,
  label: "Device",
  Icon: Cpu,
};

export type NodeInspectorProps = {
  borderColor: string;
  panelColor: string;
  selectedNode: StudioNode | null;
  /** Full flow selection order; when more than one node, inspector shows multi live readouts only. */
  orderedSelectedNodes?: StudioNode[];
  /** Node catalog (definition title + description for the selected type). */
  catalogEntries: NodeCatalogEntry[];
  /** Minimap / category chips (same colors as the flow canvas). */
  categoryColors: Record<NodeCatalogEntry["category"], string>;
  onUpdateLabel: (nextLabel: string) => void;
  onUpdateNodeUiResizable: (resizable: boolean) => void;
  onUpdateConfigField: (key: string, value: unknown) => boolean;
  onUpdateConfigJson: (
    nextJson: string,
  ) => { ok: true } | { ok: false; message: string };
  /** When no node is selected, show canvas-level controls (omit for legacy layouts). */
  canvasInspector?: Omit<
    CanvasInspectorPanelProps,
    "nodes" | "edges" | "orderedSelectedNodes"
  >;
  nodes?: CanvasInspectorPanelProps["nodes"];
  edges?: CanvasInspectorPanelProps["edges"];
  orderedSelectedNodesForCanvas?: CanvasInspectorPanelProps["orderedSelectedNodes"];
};

export function NodeInspector(props: NodeInspectorProps) {
  const {
    borderColor,
    panelColor,
    selectedNode: selectedNodeProp,
    orderedSelectedNodes: orderedSelectedNodesProp,
    catalogEntries,
    categoryColors,
    onUpdateLabel,
    onUpdateNodeUiResizable,
    onUpdateConfigField,
    onUpdateConfigJson,
    canvasInspector,
    nodes: canvasNodes,
    edges: canvasEdges,
    orderedSelectedNodesForCanvas,
  } = props;

  const orderedSelectedNodes =
    orderedSelectedNodesProp != null && orderedSelectedNodesProp.length > 0
      ? orderedSelectedNodesProp
      : selectedNodeProp != null
        ? [selectedNodeProp]
        : [];
  const selectedNode = orderedSelectedNodes[0] ?? null;
  const isMultiSelect = orderedSelectedNodes.length > 1;
  const homogeneousMultiEdit = useMemo(() => {
    if (!isMultiSelect) {
      return false;
    }
    const firstId = orderedSelectedNodes[0]?.data.nodeId;
    if (firstId == null) {
      return false;
    }
    return orderedSelectedNodes.every((n) => n.data.nodeId === firstId);
  }, [isMultiSelect, orderedSelectedNodes]);
  const [jsonDraft, setJsonDraft] = useState("{}");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [sourceKeyDraft, setSourceKeyDraft] = useState("");
  const [sourceKeyFieldError, setSourceKeyFieldError] = useState<string | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<InspectorMainTab>(() =>
    readStoredInspectorActiveTab(),
  );
  const selectedNodeId = selectedNode?.id ?? null;

  const setActiveTabPersisted = useCallback((next: InspectorMainTab) => {
    setActiveTab(next);
    writeStoredInspectorActiveTab(next);
  }, []);
  useEffect(() => {
    if (selectedNode == null) {
      setJsonDraft("{}");
      setJsonError(null);
      return;
    }
    setJsonDraft(JSON.stringify(selectedNode.data.defaultConfig, null, 2));
    setJsonError(null);
  }, [selectedNodeId]);

  const deviceSourceId = useMemo(
    () => resolveStudioNodeSourceId(selectedNode),
    [selectedNode],
  );

  const visibleTabs = useMemo(() => {
    if (deviceSourceId != null) {
      return [...CORE_INSPECTOR_TABS, DEVICE_INSPECTOR_TAB];
    }
    return CORE_INSPECTOR_TABS;
  }, [deviceSourceId]);

  useEffect(() => {
    if (deviceSourceId == null && activeTab === "device") {
      setActiveTabPersisted("node");
    }
  }, [deviceSourceId, activeTab, setActiveTabPersisted]);

  /** Selection defaults: GLB bundle → Node; hardware-linked → Live. */
  useEffect(() => {
    if (selectedNode == null) {
      return;
    }
    if (selectedNode.data.nodeId === "glb-animation-bundle") {
      setActiveTabPersisted("node");
      return;
    }
    if (deviceSourceId != null) {
      setActiveTabPersisted("live");
    }
  }, [selectedNodeId, deviceSourceId, selectedNode?.data.nodeId, setActiveTabPersisted]);

  const persistedSourceKey =
    selectedNode != null && selectedNode.data.nodeId === "sensor-input"
      ? String(selectedNode.data.defaultConfig.sourceKey ?? "bmi270.accel.x")
      : "";

  useEffect(() => {
    if (selectedNode == null || selectedNode.data.nodeId !== "sensor-input") {
      setSourceKeyFieldError(null);
      return;
    }
    setSourceKeyDraft(persistedSourceKey);
    setSourceKeyFieldError(null);
  }, [selectedNode?.id, persistedSourceKey, selectedNode?.data.nodeId]);

  const catalogEntry = useMemo((): NodeCatalogEntry | undefined => {
    if (selectedNode == null) {
      return undefined;
    }
    return catalogEntries.find((e) => e.id === selectedNode.data.nodeId);
  }, [catalogEntries, selectedNode]);

  const categoryTint =
    selectedNode != null
      ? (categoryColors[selectedNode.data.category] ?? "#a1a1aa")
      : "#a1a1aa";
  const isRotation3DNode =
    selectedNode != null && isRotation3DCatalogNodeId(selectedNode.data.nodeId);

  const tabPanelClassName =
    activeTab === "node"
      ? "scrollbar-hide flex min-h-0 flex-1 flex-col gap-2 overflow-hidden overflow-x-hidden px-2.5 pb-3 pt-2"
      : activeTab === "device"
        ? "scrollbar-hide flex min-h-0 flex-1 flex-col overflow-hidden overflow-x-hidden px-2.5 pb-3 pt-2"
        : "scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 pb-3 pt-2";

  return (
    <section
      className="flex min-h-0 w-full min-w-0 flex-1 flex-col rounded border p-2"
      style={{
        borderColor,
        backgroundColor: panelColor,
      }}
    >
      <div className="mb-2 shrink-0">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-100">
          <SlidersHorizontal
            className="h-3.5 w-3.5 shrink-0 text-zinc-400"
            aria-hidden
          />
          Inspector
        </div>
      </div>
      {selectedNode == null ? (
        canvasInspector != null &&
        canvasNodes != null &&
        canvasEdges != null &&
        orderedSelectedNodesForCanvas != null ? (
          <CanvasInspectorPanel
            nodes={canvasNodes}
            edges={canvasEdges}
            orderedSelectedNodes={orderedSelectedNodesForCanvas}
            {...canvasInspector}
          />
        ) : (
          <div className="min-h-0 flex-1 text-xs leading-relaxed text-zinc-400">
            Select a flow node to inspect its ports, live readings, and
            configuration.
          </div>
        )
      ) : isMultiSelect && !homogeneousMultiEdit ? (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-zinc-700/55 bg-zinc-950/45">
          <div className="shrink-0 border-b border-zinc-800/70 px-2.5 pb-1.5 pt-2 text-[11px] font-semibold tracking-wide text-zinc-100/90">
            Live — {orderedSelectedNodes.length} nodes
          </div>
          <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 pb-3 pt-2">
            <NodeInspectorMultiLiveReadouts nodes={orderedSelectedNodes} />
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-zinc-700/55 bg-zinc-950/45">
          <TRNTabs
            value={activeTab}
            onValueChange={(next) =>
              setActiveTabPersisted(next as InspectorMainTab)
            }
            className="flex min-h-0 min-w-0 flex-1 flex-col"
            activeTriggerClassName={trnInspectorTabActiveClassName(activeTab, "live")}
          >
            <div className={TRN_INSPECTOR_TAB_BAR_WRAP_CLASS}>
              <TRNTabsList className={TRN_INSPECTOR_TAB_LIST_CLASS}>
                {visibleTabs.map(({ id, label, Icon }) => (
                  <TRNTabsTrigger
                    key={id}
                    value={id}
                    className={TRN_INSPECTOR_TAB_TRIGGER_CLASS}
                  >
                    <Icon
                      className="h-3.5 w-3.5 shrink-0 opacity-85"
                      aria-hidden
                    />
                    {label}
                  </TRNTabsTrigger>
                ))}
              </TRNTabsList>
            </div>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              {homogeneousMultiEdit ? (
                <div className="shrink-0 border-b border-amber-900/30 bg-amber-950/20 px-2.5 py-1.5 text-[10px] leading-snug text-amber-100/90">
                  Editing {orderedSelectedNodes.length} nodes — typed node settings
                  apply to all selected (
                  <span className="font-mono text-amber-50/95">
                    {selectedNode.data.nodeId}
                  </span>
                  ). JSON edit is disabled; use a single selection for raw JSON.
                </div>
              ) : null}
              <InspectorContextBar
                label={selectedNode.data.label}
                nodeId={selectedNode.data.nodeId}
                catalogTitle={catalogEntry?.title}
                catalogDescription={catalogEntry?.description}
                catalogIconSlug={catalogEntry?.icon}
                category={selectedNode.data.category}
                categoryTint={categoryTint}
                activeTab={activeTab}
                lastUpdatedAt={selectedNode.data.lastUpdatedAt}
                sensorStreamMode={selectedNode.data.sensorStreamMode}
                sensorHealth={selectedNode.data.sensorHealth}
              />
              <div className={tabPanelClassName}>
                {activeTab === "details" ? (
                <NodeInspectorDetailsTab
                  selectedNode={selectedNode}
                  catalogEntry={catalogEntry}
                />
                ) : null}

                {activeTab === "live" ? (
                  homogeneousMultiEdit ? (
                    <div className="space-y-2">
                      <NodeInspectorMultiLiveReadouts
                        nodes={orderedSelectedNodes}
                      />
                    </div>
                  ) : (
                    <NodeInspectorLiveTab selectedNode={selectedNode} />
                  )
                ) : null}

                {activeTab === "node" ? (
                  <NodeInspectorNodeTab
                    selectedNode={selectedNode}
                    catalogDefinitionTitle={catalogEntry?.title ?? ""}
                    isRotation3DNode={isRotation3DNode}
                    suppressDefaultConfigJson={homogeneousMultiEdit}
                    onUpdateLabel={onUpdateLabel}
                    onUpdateNodeUiResizable={onUpdateNodeUiResizable}
                    onUpdateConfigField={onUpdateConfigField}
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
                ) : null}

                {activeTab === "device" && deviceSourceId != null ? (
                  <NodeInspectorDeviceTab sourceId={deviceSourceId} />
                ) : null}
              </div>
            </div>
          </TRNTabs>
        </div>
      )}
    </section>
  );
}
