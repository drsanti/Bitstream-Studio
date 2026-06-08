import { memo, useCallback, useLayoutEffect, useMemo, useRef } from "react";
import {
  Copy,
  Expand,
  Frame,
  Link2,
  Maximize2,
  Target,
  Trash2,
  Unlink,
} from "lucide-react";
import { readFlowGraphStoreStructuralRevision } from "../../flow-graph-store-revisions";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import type { FlowGraphNode } from "../../store/flow-editor.store";
import { isStudioFrameNode } from "../../layout/frame-flow-nodes";
import { isStudioNodeGroupNode } from "../../subgraphs/studio-subgraph.types";
import {
  getBodyControlsVisibleUIState,
  getSocketValuesVisibleUIState,
  getSocketsExpandedUIState,
  selectionAllowsBodyCollapse,
  selectionSupportsSocketCollapse,
} from "../../nodes/flow-node/socket-display";
import {
  FLOW_NODE_SELECTION_TOOLBAR_DIVIDER_CLASS,
  FLOW_NODE_SELECTION_TOOLBAR_PILL_CLASS,
  flowNodeSelectionToolbarBtnClass,
  flowNodeSelectionToolbarDangerBtnClass,
} from "./flow-toolbar-tokens";
import { FLOW_CANVAS_DELETE_KEY_HINT } from "../../keyboard/flow-canvas-delete-keys";
import { useFlowNodeDragActive } from "../../nodes/flow-node/flow-node-drag-state";
import {
  BodyControlsToggle,
  SocketDisplayToggle,
  SocketValuesToggle,
} from "./FlowToolbarToggles";

const TOOLBAR_GAP_PX = 10;
const DRAG_FLIP_THRESHOLD_PX = 2;

type ToolbarPlacement = "above" | "below";

type ToolbarAnchor = {
  left: number;
  top: number;
  placement: ToolbarPlacement;
};

function readNodeSelectionToolbarIdsKey(state: {
  selectedNodeId: string | null;
  selectedNodeIds: string[];
}): string {
  const ids =
    state.selectedNodeIds.length > 0
      ? state.selectedNodeIds
      : state.selectedNodeId != null
        ? [state.selectedNodeId]
        : [];
  if (ids.length === 0) {
    return "";
  }
  return [...ids].sort().join("\0");
}

function toolbarAnchorsEqual(a: ToolbarAnchor | null, b: ToolbarAnchor | null): boolean {
  if (a === b) {
    return true;
  }
  if (a == null || b == null) {
    return false;
  }
  return (
    Math.round(a.left) === Math.round(b.left) &&
    Math.round(a.top) === Math.round(b.top) &&
    a.placement === b.placement
  );
}

function unionNodeBounds(
  wrapper: HTMLElement,
  nodeIds: string[],
): { left: number; top: number; width: number; height: number } | null {
  const wr = wrapper.getBoundingClientRect();
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let found = false;

  for (const id of nodeIds) {
    const el = wrapper.querySelector<HTMLElement>(`.react-flow__node[data-id="${id}"]`);
    if (el == null) {
      continue;
    }
    const nr = el.getBoundingClientRect();
    minX = Math.min(minX, nr.left);
    minY = Math.min(minY, nr.top);
    maxX = Math.max(maxX, nr.right);
    maxY = Math.max(maxY, nr.bottom);
    found = true;
  }

  if (!found) {
    return null;
  }

  return {
    left: minX - wr.left,
    top: minY - wr.top,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export const NodeSelectionToolbar = memo(function NodeSelectionToolbar(props: {
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  onFitSelection: (nodeIds: string[]) => void;
}) {
  const { wrapperRef, onFitSelection } = props;
  const graphStructuralRevision = useFlowEditorStore((s) =>
    readFlowGraphStoreStructuralRevision(s.nodes, s.edges),
  );
  const nodes = useMemo(
    () => useFlowEditorStore.getState().nodes,
    [graphStructuralRevision],
  );
  const selectedIdsKey = useFlowEditorStore(readNodeSelectionToolbarIdsKey);
  const duplicateSelection = useFlowEditorStore((s) => s.duplicateSelection);
  const deleteSelection = useFlowEditorStore((s) => s.deleteSelection);
  const createFrameAroundSelection = useFlowEditorStore((s) => s.createFrameAroundSelection);
  const fitSelectedFramesToContents = useFlowEditorStore((s) => s.fitSelectedFramesToContents);
  const detachSelectionFromFrame = useFlowEditorStore((s) => s.detachSelectionFromFrame);
  const ungroupSelection = useFlowEditorStore((s) => s.ungroupSelection);
  const duplicateGroupLinked = useFlowEditorStore((s) => s.duplicateGroupLinked);
  const duplicateGroupDeepCopy = useFlowEditorStore((s) => s.duplicateGroupDeepCopy);
  const edges = useMemo(
    () => useFlowEditorStore.getState().edges,
    [graphStructuralRevision],
  );
  const toggleBodyControlsVisibleForNodes = useFlowEditorStore(
    (s) => s.toggleBodyControlsVisibleForNodes,
  );
  const toggleSocketsExpandedForNodes = useFlowEditorStore((s) => s.toggleSocketsExpandedForNodes);
  const toggleSocketValuesVisibleForNodes = useFlowEditorStore(
    (s) => s.toggleSocketValuesVisibleForNodes,
  );

  const selectedIds = useMemo((): string[] => {
    if (selectedIdsKey.length === 0) {
      return [];
    }
    return selectedIdsKey.split("\0");
  }, [selectedIdsKey]);
  const selectedNodes = useMemo(
    () => selectedIds.map((id) => nodes.find((n) => n.id === id)).filter(Boolean),
    [nodes, selectedIds],
  );
  const multi = selectedNodes.length > 1;
  const singleNodeGroup =
    selectedNodes.length === 1 && isStudioNodeGroupNode(selectedNodes[0]);
  const singleGroupId = singleNodeGroup ? selectedNodes[0]!.id : null;

  const selectedFrameIds = useMemo(
    () => selectedNodes.filter((n) => isStudioFrameNode(n)).map((n) => n.id),
    [selectedNodes],
  );
  const onlyFramesSelected =
    selectedNodes.length > 0 && selectedNodes.every((n) => isStudioFrameNode(n));

  const canFrameSelection = useMemo(
    () =>
      selectedNodes.some(
        (n) =>
          !isStudioFrameNode(n) &&
          n.type !== "studio-note" &&
          !isStudioNodeGroupNode(n) &&
          n.type !== "studio-group-input" &&
          n.type !== "studio-group-output" &&
          n.parentId == null,
      ),
    [selectedNodes],
  );

  const canFitSelectedFrames = useMemo(
    () => selectedFrameIds.some((frameId) => nodes.some((n) => n.parentId === frameId)),
    [selectedFrameIds, nodes],
  );

  const canDetachFromFrame = useMemo(
    () =>
      selectedNodes.some((n) => {
        if (n.parentId == null) {
          return false;
        }
        const parent = nodes.find((p) => p.id === n.parentId);
        return parent != null && isStudioFrameNode(parent);
      }),
    [selectedNodes, nodes],
  );

  const showFrameActions =
    canFrameSelection || canFitSelectedFrames || canDetachFromFrame || selectedFrameIds.length > 0;

  const studioSelectedIds = useMemo(
    () =>
      selectedIds.filter((id) => {
        const n = nodes.find((node) => node.id === id);
        return n?.type === "studio";
      }),
    [selectedIds, nodes],
  );
  const showSocketControls = studioSelectedIds.length > 0;
  const showBodyControls = studioSelectedIds.length > 0;

  const socketValuesVisible = useMemo(
    () => getSocketValuesVisibleUIState(nodes, studioSelectedIds),
    [nodes, studioSelectedIds],
  );
  const socketsExpanded = useMemo(
    () => getSocketsExpandedUIState(nodes, studioSelectedIds),
    [nodes, studioSelectedIds],
  );
  const socketDisplayToggleDisabled = useMemo(() => {
    if (studioSelectedIds.length === 0) {
      return true;
    }
    return !selectionSupportsSocketCollapse(nodes, edges, studioSelectedIds);
  }, [nodes, edges, studioSelectedIds]);

  const bodyControlsToggleDisabled = useMemo(() => {
    if (studioSelectedIds.length === 0) {
      return true;
    }
    return !selectionAllowsBodyCollapse(nodes, studioSelectedIds);
  }, [nodes, studioSelectedIds]);

  const bodyControlsVisible = useMemo(
    () => getBodyControlsVisibleUIState(nodes, studioSelectedIds),
    [nodes, studioSelectedIds],
  );

  const isDraggingSelection = useMemo(
    () => selectedNodes.some((n) => (n as FlowGraphNode & { dragging?: boolean }).dragging),
    [selectedNodes],
  );
  const flowNodeDragActive = useFlowNodeDragActive();
  const trackToolbarDuringDrag = flowNodeDragActive || isDraggingSelection;

  const toolbarRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<ToolbarAnchor | null>(null);
  const lastBoundsTopRef = useRef<number | null>(null);
  const dragPlacementRef = useRef<ToolbarPlacement>("above");
  const selectedIdsRef = useRef(selectedIds);
  const trackToolbarDuringDragRef = useRef(trackToolbarDuringDrag);
  selectedIdsRef.current = selectedIds;
  trackToolbarDuringDragRef.current = trackToolbarDuringDrag;

  const applyAnchorToDom = useCallback((next: ToolbarAnchor | null) => {
    const el = toolbarRef.current;
    if (el == null) {
      return;
    }
    if (next == null) {
      el.style.visibility = "hidden";
      return;
    }
    el.style.visibility = "visible";
    el.style.left = `${next.left}px`;
    el.style.top = `${next.top}px`;
    el.classList.toggle("-translate-y-full", next.placement === "above");
    el.classList.toggle("translate-y-0", next.placement !== "above");
  }, []);

  const commitAnchor = useCallback(
    (next: ToolbarAnchor | null) => {
      if (toolbarAnchorsEqual(anchorRef.current, next)) {
        return;
      }
      anchorRef.current = next;
      applyAnchorToDom(next);
    },
    [applyAnchorToDom],
  );

  const updateAnchor = useCallback(() => {
    const wrapper = wrapperRef.current;
    const ids = selectedIdsRef.current;
    const dragging = trackToolbarDuringDragRef.current;
    if (wrapper == null || ids.length === 0) {
      commitAnchor(null);
      lastBoundsTopRef.current = null;
      return;
    }

    const bounds = unionNodeBounds(wrapper, ids);
    if (bounds == null) {
      return;
    }

    let placement: ToolbarPlacement = "above";
    if (dragging) {
      const prevTop = lastBoundsTopRef.current;
      if (prevTop != null) {
        const deltaY = bounds.top - prevTop;
        if (deltaY < -DRAG_FLIP_THRESHOLD_PX) {
          dragPlacementRef.current = "below";
        } else if (deltaY > DRAG_FLIP_THRESHOLD_PX) {
          dragPlacementRef.current = "above";
        }
      }
      placement = dragPlacementRef.current;
      lastBoundsTopRef.current = bounds.top;
    } else {
      dragPlacementRef.current = "above";
      lastBoundsTopRef.current = bounds.top;
    }

    const top =
      placement === "below"
        ? bounds.top + bounds.height + TOOLBAR_GAP_PX
        : bounds.top - TOOLBAR_GAP_PX;

    commitAnchor({
      left: Math.round(bounds.left + bounds.width / 2),
      top: Math.round(top),
      placement,
    });
  }, [wrapperRef, commitAnchor]);

  const updateAnchorRef = useRef(updateAnchor);
  updateAnchorRef.current = updateAnchor;
  const wasTrackingToolbarDuringDragRef = useRef(false);

  useLayoutEffect(() => {
    if (selectedIdsKey.length === 0) {
      commitAnchor(null);
      lastBoundsTopRef.current = null;
      return;
    }
    lastBoundsTopRef.current = null;
    updateAnchorRef.current();
    const retryFrame = requestAnimationFrame(() => {
      updateAnchorRef.current();
    });
    return () => cancelAnimationFrame(retryFrame);
  }, [selectedIdsKey, commitAnchor]);

  useLayoutEffect(() => {
    if (selectedIdsKey.length === 0) {
      return;
    }
    const onResize = () => {
      updateAnchorRef.current();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [selectedIdsKey]);

  useLayoutEffect(() => {
    if (!trackToolbarDuringDrag || selectedIdsKey.length === 0) {
      return;
    }
    let frame = 0;
    const tick = () => {
      updateAnchorRef.current();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [trackToolbarDuringDrag, selectedIdsKey]);

  useLayoutEffect(() => {
    const wasTracking = wasTrackingToolbarDuringDragRef.current;
    wasTrackingToolbarDuringDragRef.current = trackToolbarDuringDrag;
    if (wasTracking && !trackToolbarDuringDrag && selectedIdsKey.length > 0) {
      lastBoundsTopRef.current = null;
      updateAnchorRef.current();
    }
  }, [trackToolbarDuringDrag, selectedIdsKey]);

  const handleFit = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      if (selectedIds.length === 0) {
        return;
      }
      void onFitSelection(selectedIds);
    },
    [selectedIds, onFitSelection],
  );

  if (selectedIds.length === 0) {
    return null;
  }

  const countLabel = selectedIds.length === 1 ? null : `${selectedIds.length} nodes`;

  return (
    <div
      ref={toolbarRef}
      className={`${FLOW_NODE_SELECTION_TOOLBAR_PILL_CLASS} absolute z-30 max-w-[min(96vw,28rem)] -translate-x-1/2 -translate-y-full`}
      style={{ left: 0, top: 0, visibility: "hidden" }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {countLabel != null ? (
        <>
          <span className="px-2 text-[10px] font-semibold text-zinc-400">{countLabel}</span>
          <div className={FLOW_NODE_SELECTION_TOOLBAR_DIVIDER_CLASS} />
        </>
      ) : null}
      {showSocketControls ? (
        <>
          <SocketValuesToggle
            className={flowNodeSelectionToolbarBtnClass(
              false,
              socketValuesVisible,
            )}
            pressed={socketValuesVisible}
            onToggle={() => toggleSocketValuesVisibleForNodes(studioSelectedIds)}
            title={
              socketValuesVisible
                ? "Hide socket live values on selection (Shift+V)"
                : "Show socket live values on selection (Shift+V)"
            }
            ariaLabel={
              socketValuesVisible
                ? "Hide socket live values on selection"
                : "Show socket live values on selection"
            }
          />
          <SocketDisplayToggle
            className={flowNodeSelectionToolbarBtnClass(
              socketDisplayToggleDisabled,
              socketsExpanded,
            )}
            pressed={socketsExpanded}
            onToggle={() => toggleSocketsExpandedForNodes(studioSelectedIds)}
            disabled={socketDisplayToggleDisabled}
            title={
              socketDisplayToggleDisabled
                ? "No unused sockets to collapse on selection"
                : socketsExpanded
                  ? "Hide unwired sockets on selection (Shift+H)"
                  : "Show unwired sockets on selection (Shift+H)"
            }
            ariaLabel={
              socketsExpanded
                ? "Hide unwired sockets on selection"
                : "Show unwired sockets on selection"
            }
          />
          <div className={FLOW_NODE_SELECTION_TOOLBAR_DIVIDER_CLASS} />
        </>
      ) : null}
      {showBodyControls ? (
        <>
          <BodyControlsToggle
            className={flowNodeSelectionToolbarBtnClass(
              bodyControlsToggleDisabled,
              bodyControlsVisible,
            )}
            pressed={bodyControlsVisible}
            onToggle={() => toggleBodyControlsVisibleForNodes(studioSelectedIds)}
            disabled={bodyControlsToggleDisabled}
            title={
              bodyControlsToggleDisabled
                ? "Node body collapse disabled — enable in Inspector → Node → Body panel"
                : bodyControlsVisible
                  ? "Hide node body on selection (Shift+B)"
                  : "Show node body on selection (Shift+B)"
            }
            ariaLabel={
              bodyControlsVisible ? "Hide node body on selection" : "Show node body on selection"
            }
          />
          <div className={FLOW_NODE_SELECTION_TOOLBAR_DIVIDER_CLASS} />
        </>
      ) : null}
      {showFrameActions ? (
        <>
          {canFrameSelection ? (
            <button
              type="button"
              className={flowNodeSelectionToolbarBtnClass()}
              title="Frame around selection"
              aria-label="Frame around selection"
              onClick={(e) => {
                e.stopPropagation();
                createFrameAroundSelection();
              }}
            >
              <Frame size={14} />
            </button>
          ) : null}
          {selectedFrameIds.length > 0 ? (
            <button
              type="button"
              className={flowNodeSelectionToolbarBtnClass(!canFitSelectedFrames)}
              title="Fit frame to contents"
              aria-label="Fit frame to contents"
              disabled={!canFitSelectedFrames}
              onClick={(e) => {
                e.stopPropagation();
                fitSelectedFramesToContents(selectedFrameIds);
              }}
            >
              <Maximize2 size={14} />
            </button>
          ) : null}
          {canDetachFromFrame ? (
            <button
              type="button"
              className={flowNodeSelectionToolbarBtnClass()}
              title="Remove from frame"
              aria-label="Remove from frame"
              onClick={(e) => {
                e.stopPropagation();
                detachSelectionFromFrame();
              }}
            >
              <Unlink size={14} />
            </button>
          ) : null}
          <div className={FLOW_NODE_SELECTION_TOOLBAR_DIVIDER_CLASS} />
        </>
      ) : null}
      {singleNodeGroup ? (
        <>
          <button
            type="button"
            className={flowNodeSelectionToolbarBtnClass()}
            title="Ungroup (Ctrl+Shift+G)"
            aria-label="Ungroup"
            onClick={(e) => {
              e.stopPropagation();
              ungroupSelection();
            }}
          >
            <Expand size={14} />
          </button>
          <button
            type="button"
            className={flowNodeSelectionToolbarBtnClass()}
            title="Linked duplicate"
            aria-label="Linked duplicate"
            onClick={(e) => {
              e.stopPropagation();
              if (singleGroupId != null) {
                duplicateGroupLinked(singleGroupId);
              }
            }}
          >
            <Link2 size={14} />
          </button>
          <button
            type="button"
            className={flowNodeSelectionToolbarBtnClass()}
            title="Deep copy group"
            aria-label="Deep copy group"
            onClick={(e) => {
              e.stopPropagation();
              if (singleGroupId != null) {
                duplicateGroupDeepCopy(singleGroupId);
              }
            }}
          >
            <Copy size={14} />
          </button>
        </>
      ) : (
        <button
          type="button"
          className={flowNodeSelectionToolbarBtnClass()}
          title={multi ? "Duplicate selection (Ctrl+D)" : "Duplicate node (Ctrl+D)"}
          aria-label={multi ? "Duplicate selection" : "Duplicate node"}
          onClick={(e) => {
            e.stopPropagation();
            duplicateSelection();
          }}
        >
          <Copy size={14} />
        </button>
      )}
      <div className={FLOW_NODE_SELECTION_TOOLBAR_DIVIDER_CLASS} />
      <button
        type="button"
        className={flowNodeSelectionToolbarBtnClass()}
        title={multi ? "Frame selection in view (F)" : "Frame node in view (F)"}
        aria-label={multi ? "Frame selection in view" : "Frame node in view"}
        onClick={handleFit}
      >
        <Target size={14} />
      </button>
      <div className={FLOW_NODE_SELECTION_TOOLBAR_DIVIDER_CLASS} />
      <button
        type="button"
        className={
          onlyFramesSelected ? flowNodeSelectionToolbarBtnClass() : flowNodeSelectionToolbarDangerBtnClass()
        }
        title={
          onlyFramesSelected
            ? `Dissolve frame (${FLOW_CANVAS_DELETE_KEY_HINT})`
            : multi
              ? `Delete selection (${FLOW_CANVAS_DELETE_KEY_HINT})`
              : `Delete node (${FLOW_CANVAS_DELETE_KEY_HINT})`
        }
        aria-label={
          onlyFramesSelected ? "Dissolve frame" : multi ? "Delete selection" : "Delete node"
        }
        onClick={(e) => {
          e.stopPropagation();
          deleteSelection();
        }}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
});
