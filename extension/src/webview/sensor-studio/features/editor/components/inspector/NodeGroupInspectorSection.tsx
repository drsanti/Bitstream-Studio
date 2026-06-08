import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Copy,
  Download,
  FolderOpen,
  Link2,
  Link2Off,
  LogIn,
  LogOut,
  Waypoints,
  Plus,
  RefreshCw,
  Save,
  Tag,
  Ungroup,
  Upload,
} from "lucide-react";
import {
  TRNButton,
  TRNTabs,
  TRNTabsList,
  TRNTabsTrigger,
  TRN_INSPECTOR_TAB_ACTIVE_CLASS,
  TRN_INSPECTOR_TAB_BAR_WRAP_CLASS,
  TRN_INSPECTOR_TAB_LIST_CLASS,
  TRN_INSPECTOR_TAB_TRIGGER_CLASS,
} from "../../../../../ui/TRN";
import { createManualGroupSocket } from "../../subgraphs/studio-group-interface-sync";
import { countGroupSocketWires } from "../../subgraphs/studio-group-socket-wires";
import { countStudioSubgraphHosts } from "../../subgraphs/duplicate-group-instance";
import { findLinkedStudioLibraryPreset } from "../../subgraphs/node-library/library-preset-upsert";
import { parseStudioNodeAssetFile } from "../../subgraphs/node-library/studio-node-asset-file";
import { GroupLibraryOpenLink } from "../flow-library/GroupLibraryOpenLink";
import {
  emptyGroupInterface,
  STUDIO_ROOT_GRAPH_ID,
  type StudioGroupInterface,
  type StudioNodeGroupData,
} from "../../subgraphs/studio-subgraph.types";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { GroupInspectorContextBar } from "./GroupInspectorContextBar";
import { GroupSocketSortableList } from "./GroupSocketSortableList";
import { INSPECTOR_SCOPE_BADGES } from "./inspector-section-scope-badges";
import { INSPECTOR_NODE_TAB_CARD_STACK_CLASS } from "./inspector-node-tab-stack";
import { InspectorCollapsibleSection } from "./InspectorCollapsibleSection";
import { InspectorTextField } from "./InspectorNumericScrubRow";
import { InspectorSection } from "./InspectorSection";
import {
  readStoredNodeGroupInspectorTab,
  writeStoredNodeGroupInspectorTab,
  type NodeGroupInspectorTab,
} from "./node-group-inspector-ui-persistence";

type NodeGroupInspectorSectionProps = {
  hostNodeId: string;
  data: StudioNodeGroupData;
  /** When a boundary node is selected inside the group, show which role is focused. */
  focusedBoundaryRole?: "input" | "output" | null;
};

export function NodeGroupInspectorSection(props: NodeGroupInspectorSectionProps) {
  const { hostNodeId, data, focusedBoundaryRole = null } = props;
  const subgraphs = useFlowEditorStore((s) => s.subgraphs);
  const rootNodes = useFlowEditorStore((s) => s.rootNodes);
  const activeGraphId = useFlowEditorStore((s) => s.activeGraphId);
  const updateNodeGroupInterface = useFlowEditorStore((s) => s.updateNodeGroupInterface);
  const rootEdges = useFlowEditorStore((s) => s.rootEdges);
  const updateNodeGroupTitle = useFlowEditorStore((s) => s.updateNodeGroupTitle);
  const enterGroup = useFlowEditorStore((s) => s.enterGroup);
  const ungroupNodeGroup = useFlowEditorStore((s) => s.ungroupNodeGroup);
  const duplicateGroupLinked = useFlowEditorStore((s) => s.duplicateGroupLinked);
  const duplicateGroupDeepCopy = useFlowEditorStore((s) => s.duplicateGroupDeepCopy);
  const openSaveToLibraryDialog = useFlowEditorStore((s) => s.openSaveToLibraryDialog);
  const exportGroupAsNodeAssetFile = useFlowEditorStore((s) => s.exportGroupAsNodeAssetFile);
  const importNodeAssetIntoGroup = useFlowEditorStore((s) => s.importNodeAssetIntoGroup);
  const updateGroupFromLibrary = useFlowEditorStore((s) => s.updateGroupFromLibrary);
  const breakGroupLibraryLink = useFlowEditorStore((s) => s.breakGroupLibraryLink);
  const nodeGroupLibrary = useFlowEditorStore((s) => s.nodeGroupLibrary);
  const remoteNodeGraphAssets = useFlowEditorStore((s) => s.remoteNodeGraphAssets);
  const importFileRef = useRef<HTMLInputElement>(null);
  const [libraryFeedback, setLibraryFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<NodeGroupInspectorTab>(() =>
    readStoredNodeGroupInspectorTab(),
  );

  useEffect(() => {
    if (focusedBoundaryRole != null) {
      setActiveTab("interface");
      writeStoredNodeGroupInspectorTab("interface");
    }
  }, [focusedBoundaryRole]);

  const subgraphId = data.subgraphId ?? hostNodeId;
  const subgraphDoc = subgraphs[subgraphId];
  const iface = subgraphDoc?.interface ?? emptyGroupInterface();

  const title = useMemo(() => {
    const fromData = typeof data.graphTitle === "string" ? data.graphTitle.trim() : "";
    const fromSub = typeof subgraphDoc?.graphTitle === "string" ? subgraphDoc.graphTitle.trim() : "";
    return fromData || fromSub || "Node Group";
  }, [data.graphTitle, subgraphDoc?.graphTitle]);

  const isInsideGroup = activeGraphId === subgraphId;
  const enterDisabled = isInsideGroup;
  const linkedHostCount = useMemo(
    () => countStudioSubgraphHosts(subgraphId, rootNodes, subgraphs),
    [subgraphId, rootNodes, subgraphs],
  );
  const isLinkedInstance = linkedHostCount > 1;

  const linkedPreset = useMemo(() => {
    if (typeof data.libraryAssetId === "string") {
      return (
        nodeGroupLibrary.find((a) => a.meta.id === data.libraryAssetId) ??
        remoteNodeGraphAssets[data.libraryAssetId]
      );
    }
    return findLinkedStudioLibraryPreset(nodeGroupLibrary, {
      sourceNodeId: hostNodeId,
      presetKind: "nodeGraph",
    });
  }, [data.libraryAssetId, hostNodeId, nodeGroupLibrary, remoteNodeGraphAssets]);

  const applyInterface = useCallback(
    (next: StudioGroupInterface) => {
      updateNodeGroupInterface(hostNodeId, next);
    },
    [hostNodeId, updateNodeGroupInterface],
  );

  const addSocket = useCallback(
    (direction: "input" | "output") => {
      const socket = createManualGroupSocket(direction);
      const next: StudioGroupInterface =
        direction === "input"
          ? { ...iface, inputs: [...iface.inputs, socket] }
          : { ...iface, outputs: [...iface.outputs, socket] };
      applyInterface(next);
    },
    [applyInterface, iface],
  );

  const removeSocket = useCallback(
    (direction: "input" | "output", id: string) => {
      const list = direction === "input" ? iface.inputs : iface.outputs;
      if (list.length <= 1) {
        return;
      }
      const next: StudioGroupInterface =
        direction === "input"
          ? { ...iface, inputs: iface.inputs.filter((s) => s.id !== id) }
          : { ...iface, outputs: iface.outputs.filter((s) => s.id !== id) };
      applyInterface(next);
    },
    [applyInterface, iface],
  );

  const reorderSockets = useCallback(
    (direction: "input" | "output", reordered: StudioGroupInterface["inputs"]) => {
      const next: StudioGroupInterface =
        direction === "input"
          ? { ...iface, inputs: reordered }
          : { ...iface, outputs: reordered };
      applyInterface(next);
    },
    [applyInterface, iface],
  );

  const patchSocket = useCallback(
    (
      direction: "input" | "output",
      id: string,
      patch: Partial<
        Pick<StudioGroupInterface["inputs"][number], "label" | "portType" | "defaultValue">
      >,
    ) => {
      const list = direction === "input" ? iface.inputs : iface.outputs;
      const current = list.find((s) => s.id === id);
      if (current == null) {
        return;
      }
      if (patch.portType != null && patch.portType !== current.portType) {
        const wireCount = countGroupSocketWires({
          direction,
          hostNodeId,
          socketId: id,
          rootEdges,
          subgraph: subgraphDoc,
        });
        if (
          wireCount > 0 &&
          !window.confirm(
            `Change "${current.label}" from ${current.portType} to ${patch.portType}? ${wireCount} wire(s) on this socket will be dropped if types no longer match.`,
          )
        ) {
          return;
        }
      }
      const nextList = list.map((s) => (s.id === id ? { ...s, ...patch } : s));
      const next: StudioGroupInterface =
        direction === "input"
          ? { ...iface, inputs: nextList }
          : { ...iface, outputs: nextList };
      applyInterface(next);
    },
    [applyInterface, hostNodeId, iface, rootEdges, subgraphDoc],
  );

  const tabPanelClassName = "scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 pb-3 pt-2";

  return (
    <TRNTabs
      value={activeTab}
      onValueChange={(next) => {
        const tab = next as NodeGroupInspectorTab;
        setActiveTab(tab);
        writeStoredNodeGroupInspectorTab(tab);
      }}
      className="flex min-h-0 min-w-0 flex-1 flex-col"
      activeTriggerClassName={TRN_INSPECTOR_TAB_ACTIVE_CLASS}
    >
      <div className={TRN_INSPECTOR_TAB_BAR_WRAP_CLASS}>
        <TRNTabsList className={TRN_INSPECTOR_TAB_LIST_CLASS}>
          <TRNTabsTrigger value="interface" className={TRN_INSPECTOR_TAB_TRIGGER_CLASS}>
            <Waypoints className="h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />
            Interface
          </TRNTabsTrigger>
          <TRNTabsTrigger value="group" className={TRN_INSPECTOR_TAB_TRIGGER_CLASS}>
            <FolderOpen className="h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />
            Group
          </TRNTabsTrigger>
        </TRNTabsList>
      </div>

      <GroupInspectorContextBar
        title={title}
        hostNodeId={hostNodeId}
        inputCount={iface.inputs.length}
        outputCount={iface.outputs.length}
        isLinkedInstance={isLinkedInstance}
        linkedHostCount={linkedHostCount}
        isInsideGroup={isInsideGroup}
        focusedBoundaryRole={focusedBoundaryRole}
      />

      {activeTab === "interface" ? (
        <div className={tabPanelClassName}>
          <div className={INSPECTOR_NODE_TAB_CARD_STACK_CLASS}>
            <InspectorSection
              title="Identity"
              variant="compact"
              hint="Shown on the group shell header and breadcrumb."
            >
              <InspectorTextField
                ariaLabel="Group title"
                value={title}
                placeholder="Display name on group shell and breadcrumb"
                leadingIcon={<Tag className="h-3.5 w-3.5" aria-hidden />}
                onChange={(next) => {
                  updateNodeGroupTitle(hostNodeId, next);
                }}
              />
            </InspectorSection>

            <InspectorCollapsibleSection
              title="Inputs"
              scopeBadge={INSPECTOR_SCOPE_BADGES.interface}
              icon={<LogIn size={14} aria-hidden />}
              iconHint="Parent graph wires connect on the left of the group shell. Drag the grip to reorder sockets; removing a socket drops its wires."
              badge={
                <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300">
                  {iface.inputs.length}
                </span>
              }
              defaultExpanded={focusedBoundaryRole !== "output"}
            >
              <div className="flex justify-end">
                <TRNButton
                  type="button"
                  size="compact"
                  prefixIcon={<Plus className="h-3 w-3" aria-hidden />}
                  onClick={() => {
                    addSocket("input");
                  }}
                >
                  Add input
                </TRNButton>
              </div>
              <GroupSocketSortableList
                sockets={iface.inputs}
                direction="input"
                onRemove={(id) => {
                  removeSocket("input", id);
                }}
                onPatch={(id, patch) => {
                  patchSocket("input", id, patch);
                }}
                onReorder={(next) => {
                  reorderSockets("input", next);
                }}
              />
            </InspectorCollapsibleSection>

            <InspectorCollapsibleSection
              title="Outputs"
              scopeBadge={INSPECTOR_SCOPE_BADGES.interface}
              icon={<LogOut size={14} aria-hidden />}
              iconHint="Wires to the parent graph leave from the right of the group shell. Drag the grip to reorder sockets; removing a socket drops its wires."
              badge={
                <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300">
                  {iface.outputs.length}
                </span>
              }
              defaultExpanded={focusedBoundaryRole !== "input"}
            >
              <div className="flex justify-end">
                <TRNButton
                  type="button"
                  size="compact"
                  prefixIcon={<Plus className="h-3 w-3" aria-hidden />}
                  onClick={() => {
                    addSocket("output");
                  }}
                >
                  Add output
                </TRNButton>
              </div>
              <GroupSocketSortableList
                sockets={iface.outputs}
                direction="output"
                onRemove={(id) => {
                  removeSocket("output", id);
                }}
                onPatch={(id, patch) => {
                  patchSocket("output", id, patch);
                }}
                onReorder={(next) => {
                  reorderSockets("output", next);
                }}
              />
            </InspectorCollapsibleSection>
          </div>
        </div>
      ) : null}

      {activeTab === "group" ? (
        <div className={tabPanelClassName}>
          <div className={INSPECTOR_NODE_TAB_CARD_STACK_CLASS}>
            <TRNButton
              type="button"
              className="w-full justify-center"
              disabled={enterDisabled}
              prefixIcon={<FolderOpen className="h-3.5 w-3.5" aria-hidden />}
              hint="Open the inner subgraph to edit nodes and boundary sockets."
              onClick={() => {
                enterGroup(subgraphId);
              }}
            >
              Enter group
            </TRNButton>

            <InspectorCollapsibleSection
              title="Duplicate & ungroup"
              icon={<Copy size={14} aria-hidden />}
              iconHint="Copy this group on the parent graph or dissolve it back into separate nodes."
              defaultExpanded
            >
              <div className="flex flex-col gap-2">
                <TRNButton
                  type="button"
                  className="w-full justify-center"
                  prefixIcon={<Link2 className="h-3.5 w-3.5" aria-hidden />}
                  onClick={() => {
                    duplicateGroupLinked(hostNodeId);
                  }}
                >
                  Duplicate linked
                </TRNButton>
                <TRNButton
                  type="button"
                  className="w-full justify-center"
                  prefixIcon={<Copy className="h-3.5 w-3.5" aria-hidden />}
                  onClick={() => {
                    duplicateGroupDeepCopy(hostNodeId);
                  }}
                >
                  Duplicate deep copy
                </TRNButton>
                <TRNButton
                  type="button"
                  className="w-full justify-center"
                  prefixIcon={<Ungroup className="h-3.5 w-3.5" aria-hidden />}
                  onClick={() => {
                    ungroupNodeGroup(hostNodeId);
                  }}
                >
                  Ungroup (Ctrl+Shift+G)
                </TRNButton>
              </div>
            </InspectorCollapsibleSection>

            <InspectorCollapsibleSection
              title="Library preset"
              icon={<Save size={14} aria-hidden />}
              iconHint="Save reusable presets to Library → Groups, export .trn-node-asset.json files, or drag presets from the library onto the canvas."
              badge={
                linkedPreset != null ? (
                  <span className="max-w-44 truncate rounded bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300">
                    {linkedPreset.meta.name}
                  </span>
                ) : undefined
              }
              defaultExpanded={linkedPreset != null}
            >
              {libraryFeedback != null ? (
                <p className="text-[11px] leading-relaxed text-emerald-300/90">{libraryFeedback}</p>
              ) : null}
              <div className="flex flex-col gap-2">
                <TRNButton
                  type="button"
                  className="w-full justify-center"
                  prefixIcon={<Save className="h-3.5 w-3.5" aria-hidden />}
                  hint="Name, category, and description — saves to Presets → Groups."
                  onClick={() => openSaveToLibraryDialog()}
                >
                  Save to library
                </TRNButton>
                {linkedPreset != null ? (
                  <GroupLibraryOpenLink
                    assetId={linkedPreset.meta.id}
                    className="w-full justify-center"
                  />
                ) : null}
                {linkedPreset != null ? (
                  <>
                    <TRNButton
                      type="button"
                      className="w-full justify-center"
                      prefixIcon={<RefreshCw className="h-3.5 w-3.5" aria-hidden />}
                      onClick={() => {
                        if (
                          !window.confirm(
                            `Replace this group's inner graph with "${linkedPreset.meta.name}"? Parent wires may break if sockets changed.`,
                          )
                        ) {
                          return;
                        }
                        const ok = updateGroupFromLibrary(hostNodeId);
                        setLibraryFeedback(
                          ok
                            ? `Updated from "${linkedPreset.meta.name}".`
                            : "Could not update — linked preset not found.",
                        );
                      }}
                    >
                      Update from library
                    </TRNButton>
                    <TRNButton
                      type="button"
                      className="w-full justify-center"
                      prefixIcon={<Link2Off className="h-3.5 w-3.5" aria-hidden />}
                      onClick={() => {
                        if (
                          !window.confirm(
                            "Break the library link? The saved preset is kept; this group will no longer track it.",
                          )
                        ) {
                          return;
                        }
                        breakGroupLibraryLink(hostNodeId);
                        setLibraryFeedback("Library link removed — this group is now independent.");
                      }}
                    >
                      Break library link
                    </TRNButton>
                  </>
                ) : null}
                <TRNButton
                  type="button"
                  className="w-full justify-center"
                  prefixIcon={<Download className="h-3.5 w-3.5" aria-hidden />}
                  onClick={() => {
                    const ok = exportGroupAsNodeAssetFile(hostNodeId);
                    setLibraryFeedback(
                      ok
                        ? "Downloaded .trn-node-asset.json preset."
                        : "Could not export — this group has no inner graph.",
                    );
                  }}
                >
                  Export preset
                </TRNButton>
                <TRNButton
                  type="button"
                  className="w-full justify-center"
                  prefixIcon={<Upload className="h-3.5 w-3.5" aria-hidden />}
                  onClick={() => {
                    importFileRef.current?.click();
                  }}
                >
                  Load preset into group
                </TRNButton>
                <input
                  ref={importFileRef}
                  type="file"
                  accept=".json,.trn-node-asset.json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file == null) {
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                      const text = typeof reader.result === "string" ? reader.result : "";
                      const asset = parseStudioNodeAssetFile(text);
                      if (asset == null) {
                        setLibraryFeedback("Invalid file — expected a .trn-node-asset.json preset.");
                        return;
                      }
                      const ok = importNodeAssetIntoGroup(hostNodeId, asset);
                      setLibraryFeedback(
                        ok
                          ? `Loaded "${asset.meta.name}" into this group.`
                          : "Could not load preset into this group.",
                      );
                    };
                    reader.readAsText(file);
                    e.target.value = "";
                  }}
                />
              </div>
            </InspectorCollapsibleSection>
          </div>
        </div>
      ) : null}
    </TRNTabs>
  );
}

export { resolveNodeGroupHostId } from "../../subgraphs/resolve-node-group-host";

export function nodeGroupInspectorTitle(data: StudioNodeGroupData, subgraphTitle?: string): string {
  const fromData = typeof data.graphTitle === "string" ? data.graphTitle.trim() : "";
  const fromSub = typeof subgraphTitle === "string" ? subgraphTitle.trim() : "";
  return fromData || fromSub || "Node Group";
}
