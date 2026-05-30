import { Activity, Info, Settings } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { NodeCatalogEntry } from "../../../core/config/config-types";
import { useBitstreamDeviceSensorConfigStore } from "../../../../bitstream-app/state/bitstreamDeviceSensorConfig.store";
import { resolveStudioNodeSourceId } from "../../../core/device/resolve-studio-node-source-id";
import {
  TRNInspectorIconRail,
  type TRNInspectorIconRailItem,
} from "../../../../ui/TRN";
import { isRotation3DCatalogNodeId } from "../nodes/rotation/rotation-3d-node-ids";
import type { StudioNode } from "../store/flow-editor.store";
import { NodeInspectorDetailsTab } from "./inspector/NodeInspectorDetailsTab";
import { NodeInspectorIdentityStrip } from "./inspector/NodeInspectorIdentityStrip";
import { NodeInspectorLiveTab } from "./inspector/NodeInspectorLiveTab";
import { NodeInspectorMultiLiveReadouts } from "./inspector/NodeInspectorMultiLiveReadouts";
import { NodeInspectorSettingsTab } from "./inspector/NodeInspectorSettingsTab";
import {
  readStoredInspectorActiveTab,
  writeStoredInspectorActiveTab,
} from "./inspector/node-inspector-ui-persistence";

const INSPECTOR_TAB_RAIL_ITEMS: readonly TRNInspectorIconRailItem<
  "details" | "live" | "settings"
>[] = [
  { id: "details", label: "Details", Icon: Info },
  { id: "live", label: "Live", Icon: Activity },
  { id: "settings", label: "Settings", Icon: Settings },
];

function inspectorTabTitle(activeTab: "details" | "live" | "settings"): string {
  const hit = INSPECTOR_TAB_RAIL_ITEMS.find((i) => i.id === activeTab);
  return hit?.label ?? "Inspector";
}

export type NodeInspectorProps = {
  borderColor: string;
  panelColor: string;
  selectedNode: StudioNode | null;
  /** Full flow selection order; when more than one node, inspector shows multi live readouts only. */
  orderedSelectedNodes?: StudioNode[];
  onOpenDeviceSensorSettings?: (initialSourceId: number | null) => void;
  /** Node catalog (definition title + description for the selected type). */
  catalogEntries: NodeCatalogEntry[];
  /** Minimap / category chips (same colors as the flow canvas). */
  categoryColors: Record<NodeCatalogEntry["category"], string>;
  onUpdateLabel: (nextLabel: string) => void;
  onUpdateConfigField: (key: string, value: unknown) => boolean;
  onUpdateConfigJson: (
    nextJson: string,
  ) => { ok: true } | { ok: false; message: string };
};

export function NodeInspector(props: NodeInspectorProps) {
  const {
    borderColor,
    panelColor,
    selectedNode: selectedNodeProp,
    orderedSelectedNodes: orderedSelectedNodesProp,
    onOpenDeviceSensorSettings,
    catalogEntries,
    categoryColors,
    onUpdateLabel,
    onUpdateConfigField,
    onUpdateConfigJson,
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
  const [activeTab, setActiveTab] = useState<"details" | "live" | "settings">(() =>
    readStoredInspectorActiveTab(),
  );
  const selectedNodeId = selectedNode?.id ?? null;

  const setActiveTabPersisted = useCallback((next: "details" | "live" | "settings") => {
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

  /** GLB Animation Bundle: Settings shows wired model name when connected to a viewer. */
  useEffect(() => {
    if (selectedNode?.data.nodeId === "glb-animation-bundle") {
      setActiveTabPersisted("settings");
    }
  }, [selectedNodeId, selectedNode?.data.nodeId, setActiveTabPersisted]);

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

  const deviceSourceId = useMemo(
    () => resolveStudioNodeSourceId(selectedNode),
    [selectedNode],
  );
  const deviceRowsBySourceId = useBitstreamDeviceSensorConfigStore(
    (s) => s.bySourceId,
  );
  const deviceRow =
    deviceSourceId != null
      ? (deviceRowsBySourceId[deviceSourceId] ?? null)
      : null;

  return (
    <section
      className="flex min-h-0 w-full min-w-0 flex-1 flex-col rounded border p-2"
      style={{
        borderColor,
        backgroundColor: panelColor,
      }}
    >
      <div className="mb-2 shrink-0 text-xs font-semibold">Inspector</div>
      {selectedNode == null ? (
        <div className="min-h-0 flex-1 text-xs text-zinc-400">
          Select a node to see definition, ports, and config.
        </div>
      ) : isMultiSelect && !homogeneousMultiEdit ? (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-sky-900/25 bg-linear-to-br from-sky-950/15 via-zinc-950/55 to-zinc-950/85 px-2 pb-3 pt-2 shadow-[inset_0_1px_0_0_rgba(56,189,248,0.06)]">
          <div className="shrink-0 border-b border-sky-900/25 pb-2 text-[11px] font-semibold tracking-wide text-sky-100/90">
            Live — {orderedSelectedNodes.length} nodes
          </div>
          <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden pt-2">
            <NodeInspectorMultiLiveReadouts nodes={orderedSelectedNodes} />
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden rounded-md border border-emerald-900/25 bg-linear-to-br from-emerald-950/15 via-zinc-950/55 to-zinc-950/85 shadow-[inset_0_1px_0_0_rgba(16,185,129,0.06)]">
          <TRNInspectorIconRail
            ariaLabel="Inspector panels"
            className="shrink-0 rounded-l-md border-r border-emerald-900/30 py-1.5"
            items={INSPECTOR_TAB_RAIL_ITEMS}
            activeId={activeTab}
            onActiveChange={setActiveTabPersisted}
            tone="emerald"
          />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-zinc-950/35">
            <div className="shrink-0 border-b border-emerald-900/25 px-2 pb-1 pt-2 text-[11px] font-semibold tracking-wide text-emerald-100/90">
              {inspectorTabTitle(activeTab)}
            </div>
            {homogeneousMultiEdit ? (
              <div className="shrink-0 border-b border-amber-900/30 bg-amber-950/20 px-2 py-1.5 text-[10px] leading-snug text-amber-100/90">
                Editing {orderedSelectedNodes.length} nodes — typed settings apply to all selected (
                <span className="font-mono text-amber-50/95">{selectedNode.data.nodeId}</span>). JSON
                edit is disabled; use a single selection for raw JSON.
              </div>
            ) : null}
            <NodeInspectorIdentityStrip
              label={selectedNode.data.label}
              nodeId={selectedNode.data.nodeId}
              category={selectedNode.data.category}
              categoryTint={categoryTint}
            />
            <div
              className={
                activeTab === "settings"
                  ? "scrollbar-hide flex min-h-0 flex-1 flex-col gap-2 overflow-hidden overflow-x-hidden px-2 pb-3 pt-2"
                  : "scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 pb-3 pt-2"
              }
            >
              {activeTab === "details" ? (
                <NodeInspectorDetailsTab
                  selectedNode={selectedNode}
                  catalogEntry={catalogEntry}
                  categoryTint={categoryTint}
                  deviceSourceId={deviceSourceId}
                  deviceRow={deviceRow}
                  onOpenDeviceSensorSettings={onOpenDeviceSensorSettings}
                />
              ) : null}

              {activeTab === "live" ? (
                homogeneousMultiEdit ? (
                  <div className="space-y-2">
                    <NodeInspectorMultiLiveReadouts nodes={orderedSelectedNodes} />
                  </div>
                ) : (
                  <NodeInspectorLiveTab selectedNode={selectedNode} />
                )
              ) : null}

              {activeTab === "settings" ? (
                <NodeInspectorSettingsTab
                  selectedNode={selectedNode}
                  catalogDefinitionTitle={catalogEntry?.title ?? ""}
                  isRotation3DNode={isRotation3DNode}
                  suppressDefaultConfigJson={homogeneousMultiEdit}
                  onUpdateLabel={onUpdateLabel}
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
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
