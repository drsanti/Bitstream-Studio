import { memo, useCallback, useLayoutEffect, useMemo, useRef } from "react";
import type { Edge } from "@xyflow/react";
import { GitBranch, Route, Trash2, X } from "lucide-react";
import { TRNButton } from "../../../../../ui/TRN/TRNButton";
import { readFlowGraphStoreStructuralRevision } from "../../flow-graph-store-revisions";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { collectDownstreamEdgeIds } from "../../edges/flow-edge-downstream-path";
import { resolveFlowEdgeMidpointPosition } from "../../edges/flow-edge-midpoint";
import {
  FLOW_TOOLBAR_DIVIDER_CLASS,
  FLOW_TOOLBAR_PILL_CLASS,
  flowToolbarBtnClass,
  flowToolbarDangerBtnClass,
} from "./flow-toolbar-tokens";
import { FLOW_CANVAS_DELETE_KEY_HINT } from "../../keyboard/flow-canvas-delete-keys";

const TOOLBAR_GAP_PX = 10;

type ToolbarAnchor = {
  left: number;
  top: number;
};

function readSelectedEdgeId(state: { edges: Edge[] }): string {
  let found: string | null = null;
  for (const edge of state.edges) {
    if (edge.selected === true) {
      if (found != null) {
        return "";
      }
      found = edge.id;
    }
  }
  return found ?? "";
}

function toolbarAnchorsEqual(a: ToolbarAnchor | null, b: ToolbarAnchor | null): boolean {
  if (a === b) {
    return true;
  }
  if (a == null || b == null) {
    return false;
  }
  return Math.round(a.left) === Math.round(b.left) && Math.round(a.top) === Math.round(b.top);
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

export type EdgeSelectionToolbarProps = {
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  highlightedPathEdgeIds: ReadonlySet<string> | null;
  onHighlightDownstream: (edgeIds: ReadonlySet<string>) => void;
  onClearPathHighlight: () => void;
};

export const EdgeSelectionToolbar = memo(function EdgeSelectionToolbar(
  props: EdgeSelectionToolbarProps,
) {
  const {
    wrapperRef,
    highlightedPathEdgeIds,
    onHighlightDownstream,
    onClearPathHighlight,
  } = props;

  const graphStructuralRevision = useFlowEditorStore((s) =>
    readFlowGraphStoreStructuralRevision(s.nodes, s.edges),
  );
  const nodes = useMemo(
    () => useFlowEditorStore.getState().nodes,
    [graphStructuralRevision],
  );
  const edges = useMemo(
    () => useFlowEditorStore.getState().edges,
    [graphStructuralRevision],
  );
  const selectedEdgeId = useFlowEditorStore(readSelectedEdgeId);
  const insertRerouteOnEdge = useFlowEditorStore((s) => s.insertRerouteOnEdge);
  const onEdgesChange = useFlowEditorStore((s) => s.onEdgesChange);

  const selectedEdge = useMemo(() => {
    if (selectedEdgeId.length === 0) {
      return null;
    }
    return edges.find((edge) => edge.id === selectedEdgeId) ?? null;
  }, [edges, selectedEdgeId]);

  const pathHighlightActive =
    selectedEdge != null &&
    highlightedPathEdgeIds != null &&
    highlightedPathEdgeIds.has(selectedEdge.id);

  const toolbarRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<ToolbarAnchor | null>(null);
  const selectedEdgeIdRef = useRef(selectedEdgeId);
  selectedEdgeIdRef.current = selectedEdgeId;

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
    const edgeId = selectedEdgeIdRef.current;
    if (wrapper == null || edgeId.length === 0) {
      commitAnchor(null);
      return;
    }
    const edge = useFlowEditorStore.getState().edges.find((entry) => entry.id === edgeId);
    if (edge?.source == null || edge.target == null) {
      commitAnchor(null);
      return;
    }
    const bounds = unionNodeBounds(wrapper, [edge.source, edge.target]);
    if (bounds == null) {
      return;
    }
    commitAnchor({
      left: Math.round(bounds.left + bounds.width / 2),
      top: Math.round(bounds.top - TOOLBAR_GAP_PX),
    });
  }, [wrapperRef, commitAnchor]);

  const updateAnchorRef = useRef(updateAnchor);
  updateAnchorRef.current = updateAnchor;

  useLayoutEffect(() => {
    if (selectedEdgeId.length === 0) {
      commitAnchor(null);
      return;
    }
    updateAnchorRef.current();
    const retryFrame = requestAnimationFrame(() => {
      updateAnchorRef.current();
    });
    return () => cancelAnimationFrame(retryFrame);
  }, [selectedEdgeId, commitAnchor]);

  useLayoutEffect(() => {
    if (selectedEdgeId.length === 0) {
      return;
    }
    const wrapper = wrapperRef.current;
    if (wrapper == null) {
      return;
    }
    const observer = new ResizeObserver(() => {
      updateAnchorRef.current();
    });
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [selectedEdgeId, wrapperRef]);

  if (selectedEdge == null) {
    return null;
  }

  const portType = typeof selectedEdge.label === "string" ? selectedEdge.label : "";

  const handleInsertJunction = () => {
    const mid = resolveFlowEdgeMidpointPosition(nodes, selectedEdge);
    if (mid == null) {
      return;
    }
    insertRerouteOnEdge(selectedEdge.id, mid);
  };

  const handleDelete = () => {
    onEdgesChange([{ type: "remove", id: selectedEdge.id }]);
    if (pathHighlightActive) {
      onClearPathHighlight();
    }
  };

  return (
    <div
      ref={toolbarRef}
      className="pointer-events-none absolute z-30"
      style={{
        left: 0,
        top: 0,
        visibility: "hidden",
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className={FLOW_TOOLBAR_PILL_CLASS} role="toolbar" aria-label="Wire actions">
        <TRNButton
          type="button"
          size="compact"
          className={flowToolbarBtnClass()}
          hint="Insert reroute on this wire (midpoint)"
          aria-label="Insert reroute on wire"
          onClick={(e) => {
            e.stopPropagation();
            handleInsertJunction();
          }}
        >
          <GitBranch size={14} aria-hidden />
        </TRNButton>
        <TRNButton
          type="button"
          size="compact"
          className={flowToolbarBtnClass()}
          hint={
            pathHighlightActive
              ? "Refresh downstream path highlight"
              : "Highlight wires downstream of this link"
          }
          aria-label="Highlight downstream"
          onClick={(e) => {
            e.stopPropagation();
            onHighlightDownstream(collectDownstreamEdgeIds(selectedEdge.id, edges));
          }}
        >
          <Route size={14} aria-hidden />
        </TRNButton>
        {pathHighlightActive ? (
          <TRNButton
            type="button"
            size="compact"
            className={flowToolbarBtnClass()}
            hint="Clear downstream path highlight"
            aria-label="Clear path highlight"
            onClick={(e) => {
              e.stopPropagation();
              onClearPathHighlight();
            }}
          >
            <X size={14} aria-hidden />
          </TRNButton>
        ) : null}
        <div className={FLOW_TOOLBAR_DIVIDER_CLASS} />
        <TRNButton
          type="button"
          size="compact"
          className={flowToolbarDangerBtnClass()}
          hint={
            portType
              ? `Delete ${portType} wire (${FLOW_CANVAS_DELETE_KEY_HINT})`
              : `Delete wire (${FLOW_CANVAS_DELETE_KEY_HINT})`
          }
          aria-label="Delete wire"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
        >
          <Trash2 size={14} aria-hidden />
        </TRNButton>
      </div>
    </div>
  );
});
