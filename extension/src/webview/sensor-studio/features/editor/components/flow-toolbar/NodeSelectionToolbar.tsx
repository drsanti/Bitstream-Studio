import { memo, useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
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
import { useFlowEditorStore } from "../../store/flow-editor.store";
import type { FlowGraphNode } from "../../store/flow-editor.store";
import { isStudioFrameNode } from "../../layout/frame-flow-nodes";
import { isStudioNodeGroupNode } from "../../subgraphs/studio-subgraph.types";
import {
  getBodyControlsVisibleUIState,
  getSocketValuesVisibleUIState,
  getSocketsExpandedUIState,
  selectionAllowsBodyCollapse,
  selectionHasHideableBody,
  selectionSupportsSocketCollapse,
  selectionSupportsSocketToolbar,
} from "../../nodes/flow-node/socket-display";
import {
  FLOW_TOOLBAR_DIVIDER_CLASS,
  FLOW_TOOLBAR_PILL_CLASS,
  flowToolbarBtnClass,
  flowToolbarDangerBtnClass,
} from "./flow-toolbar-tokens";
import { BodyControlsToggle, SocketDisplayToggle, SocketValuesToggle } from "./FlowToolbarToggles";

const TOOLBAR_GAP_PX = 10;
const DRAG_FLIP_THRESHOLD_PX = 2;

type ToolbarPlacement = "above" | "below";

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
  const nodes = useFlowEditorStore((s) => s.nodes);
  const edges = useFlowEditorStore((s) => s.edges);
  const selectedNodeId = useFlowEditorStore((s) => s.selectedNodeId);
  const selectedNodeIdsFromStore = useFlowEditorStore((s) => s.selectedNodeIds);
  const duplicateSelection = useFlowEditorStore((s) => s.duplicateSelection);
  const deleteSelection = useFlowEditorStore((s) => s.deleteSelection);
  const createFrameAroundSelection = useFlowEditorStore((s) => s.createFrameAroundSelection);
  const fitSelectedFramesToContents = useFlowEditorStore((s) => s.fitSelectedFramesToContents);
  const detachSelectionFromFrame = useFlowEditorStore((s) => s.detachSelectionFromFrame);
  const ungroupSelection = useFlowEditorStore((s) => s.ungroupSelection);
  const duplicateGroupLinked = useFlowEditorStore((s) => s.duplicateGroupLinked);
  const duplicateGroupDeepCopy = useFlowEditorStore((s) => s.duplicateGroupDeepCopy);
  const toggleSocketsExpandedForNodes = useFlowEditorStore((s) => s.toggleSocketsExpandedForNodes);
  const toggleSocketValuesVisibleForNodes = useFlowEditorStore(
    (s) => s.toggleSocketValuesVisibleForNodes,
  );
  const toggleBodyControlsVisibleForNodes = useFlowEditorStore(
    (s) => s.toggleBodyControlsVisibleForNodes,
  );

  const selectedIds = useMemo(() => {
    if (selectedNodeIdsFromStore.length > 0) {
      return selectedNodeIdsFromStore;
    }
    if (selectedNodeId != null) {
      return [selectedNodeId];
    }
    // Fallback (React Flow `selected` flags) — useful during transition / debug.
    return nodes.filter((n) => n.selected).map((n) => n.id);
  }, [nodes, selectedNodeId, selectedNodeIdsFromStore]);
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
  const bodyControlsToggleDisabled = useMemo(() => {
    if (studioSelectedIds.length === 0) {
      return true;
    }
    return !selectionAllowsBodyCollapse(nodes, studioSelectedIds);
  }, [nodes, studioSelectedIds]);

  const socketsExpanded = useMemo(
    () => getSocketsExpandedUIState(nodes, studioSelectedIds),
    [nodes, studioSelectedIds],
  );
  const socketValuesVisible = useMemo(
    () => getSocketValuesVisibleUIState(nodes, studioSelectedIds),
    [nodes, studioSelectedIds],
  );
  const bodyControlsVisible = useMemo(
    () => getBodyControlsVisibleUIState(nodes, studioSelectedIds),
    [nodes, studioSelectedIds],
  );

  const socketDisplayToggleDisabled = useMemo(() => {
    if (studioSelectedIds.length === 0) {
      return true;
    }
    // Disable when collapsing/expanding would be a no-op for the entire selection
    // (e.g. all selected nodes have only one socket, or all sockets are wired already).
    return !selectionSupportsSocketCollapse(nodes, edges, studioSelectedIds);
  }, [nodes, edges, studioSelectedIds]);

  const isDraggingSelection = useMemo(
    () => selectedNodes.some((n) => (n as FlowGraphNode & { dragging?: boolean }).dragging),
    [selectedNodes],
  );

  const [anchor, setAnchor] = useState<{
    left: number;
    top: number;
    placement: ToolbarPlacement;
  } | null>(null);

  const lastBoundsTopRef = useRef<number | null>(null);
  const dragPlacementRef = useRef<ToolbarPlacement>("above");
  const lastAnchorRef = useRef<typeof anchor>(null);

  const setAnchorIfChanged = useCallback(
    (next: { left: number; top: number; placement: ToolbarPlacement } | null) => {
      setAnchor((prev) => {
        if (prev === next) {
          return prev;
        }
        if (prev == null || next == null) {
          return next;
        }
        if (prev.left === next.left && prev.top === next.top && prev.placement === next.placement) {
          return prev;
        }
        return next;
      });
    },
    [],
  );

  const updateAnchor = useCallback(() => {
    const wrapper = wrapperRef.current;
    if (wrapper == null || selectedIds.length === 0) {
      setAnchorIfChanged(null);
      lastBoundsTopRef.current = null;
      return;
    }

    const bounds = unionNodeBounds(wrapper, selectedIds);
    if (bounds == null) {
      setAnchorIfChanged(null);
      lastBoundsTopRef.current = null;
      return;
    }

    let placement: ToolbarPlacement = "above";
    if (isDraggingSelection) {
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

    setAnchorIfChanged({
      left: bounds.left + bounds.width / 2,
      top,
      placement,
    });
  }, [selectedIds, wrapperRef, isDraggingSelection, setAnchorIfChanged]);

  useLayoutEffect(() => {
    updateAnchor();
  }, [updateAnchor, selectedIds]);

  useLayoutEffect(() => {
    if (selectedIds.length === 0) {
      return;
    }
    let frame = 0;
    const tick = () => {
      updateAnchor();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    window.addEventListener("resize", updateAnchor);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateAnchor);
    };
  }, [selectedIds.length, updateAnchor]);

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

  if (anchor) {
    lastAnchorRef.current = anchor;
  }
  const renderAnchor = anchor ?? lastAnchorRef.current;
  if (renderAnchor == null) {
    return null;
  }

  const countLabel = selectedIds.length === 1 ? null : `${selectedIds.length} nodes`;

  return (
    <div
      className={`${FLOW_TOOLBAR_PILL_CLASS} absolute z-30 max-w-[min(96vw,28rem)] -translate-x-1/2 ${
        renderAnchor.placement === "above" ? "-translate-y-full" : "translate-y-0"
      }`}
      style={{ left: renderAnchor.left, top: renderAnchor.top }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {countLabel != null ? (
        <>
          <span className="px-2 text-[10px] font-semibold text-zinc-400">{countLabel}</span>
          <div className={FLOW_TOOLBAR_DIVIDER_CLASS} />
        </>
      ) : null}
      {showSocketControls ? (
        <>
          <SocketValuesToggle
            pressed={socketValuesVisible}
            onToggle={() => toggleSocketValuesVisibleForNodes(studioSelectedIds)}
            title={
              socketValuesVisible
                ? "Hide socket values on selection (Shift+V)"
                : "Show socket values on selection (Shift+V)"
            }
            ariaLabel={
              socketValuesVisible ? "Hide socket values on selection" : "Show socket values on selection"
            }
          />
          <SocketDisplayToggle
            pressed={socketsExpanded}
            onToggle={() => toggleSocketsExpandedForNodes(studioSelectedIds)}
            disabled={socketDisplayToggleDisabled}
            title={
              socketDisplayToggleDisabled
                ? "No unused sockets to collapse"
                : socketsExpanded
                  ? "Collapse unwired sockets on selection (Shift+H)"
                  : "Expand all sockets on selection (Shift+H)"
            }
            ariaLabel={
              socketsExpanded ? "Collapse sockets on selection" : "Expand sockets on selection"
            }
          />
          <div className={FLOW_TOOLBAR_DIVIDER_CLASS} />
        </>
      ) : null}
      {showBodyControls ? (
        <>
          <BodyControlsToggle
            pressed={bodyControlsVisible}
            onToggle={() => toggleBodyControlsVisibleForNodes(studioSelectedIds)}
            disabled={bodyControlsToggleDisabled}
            title={
              bodyControlsToggleDisabled
                ? "Node body collapse disabled — enable in Inspector → Canvas"
                : bodyControlsVisible
                  ? "Hide node body on selection (Shift+B)"
                  : "Show node body on selection (Shift+B)"
            }
            ariaLabel={
              bodyControlsVisible ? "Hide node body on selection" : "Show node body on selection"
            }
          />
          <div className={FLOW_TOOLBAR_DIVIDER_CLASS} />
        </>
      ) : null}
      {showFrameActions ? (
        <>
          {canFrameSelection ? (
            <button
              type="button"
              className={flowToolbarBtnClass()}
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
              className={flowToolbarBtnClass(!canFitSelectedFrames)}
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
              className={flowToolbarBtnClass()}
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
          <div className={FLOW_TOOLBAR_DIVIDER_CLASS} />
        </>
      ) : null}
      {singleNodeGroup ? (
        <>
          <button
            type="button"
            className={flowToolbarBtnClass()}
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
            className={flowToolbarBtnClass()}
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
            className={flowToolbarBtnClass()}
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
          className={flowToolbarBtnClass()}
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
      <div className={FLOW_TOOLBAR_DIVIDER_CLASS} />
      <button
        type="button"
        className={flowToolbarBtnClass()}
        title={multi ? "Frame selection in view (F)" : "Frame node in view (F)"}
        aria-label={multi ? "Frame selection in view" : "Frame node in view"}
        onClick={handleFit}
      >
        <Target size={14} />
      </button>
      <div className={FLOW_TOOLBAR_DIVIDER_CLASS} />
      <button
        type="button"
        className={
          onlyFramesSelected ? flowToolbarBtnClass() : flowToolbarDangerBtnClass()
        }
        title={
          onlyFramesSelected
            ? "Dissolve frame (Del)"
            : multi
              ? "Delete selection (Del)"
              : "Delete node (Del)"
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
