import { memo, useCallback, useLayoutEffect, useMemo, useState } from "react";
import type { Edge } from "@xyflow/react";
import { GitBranch, Route, Trash2, X } from "lucide-react";
import { TRNButton } from "../../../../../ui/TRN/TRNButton";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { collectDownstreamEdgeIds } from "../../edges/flow-edge-downstream-path";
import { resolveFlowEdgeMidpointPosition } from "../../edges/flow-edge-midpoint";
import {
  FLOW_TOOLBAR_DIVIDER_CLASS,
  FLOW_TOOLBAR_PILL_CLASS,
  flowToolbarBtnClass,
  flowToolbarDangerBtnClass,
} from "./flow-toolbar-tokens";

const TOOLBAR_GAP_PX = 10;

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

  const nodes = useFlowEditorStore((s) => s.nodes);
  const edges = useFlowEditorStore((s) => s.edges);
  const insertRerouteOnEdge = useFlowEditorStore((s) => s.insertRerouteOnEdge);
  const onEdgesChange = useFlowEditorStore((s) => s.onEdgesChange);

  const selectedEdge = useMemo(() => {
    const selected = edges.filter((e) => e.selected === true);
    if (selected.length !== 1) {
      return null;
    }
    return selected[0]!;
  }, [edges]);

  const pathHighlightActive =
    selectedEdge != null &&
    highlightedPathEdgeIds != null &&
    highlightedPathEdgeIds.has(selectedEdge.id);

  const [anchor, setAnchor] = useState<{ left: number; top: number } | null>(null);

  const updateAnchor = useCallback(() => {
    const wrapper = wrapperRef.current;
    if (wrapper == null || selectedEdge?.source == null || selectedEdge.target == null) {
      setAnchor(null);
      return;
    }
    const bounds = unionNodeBounds(wrapper, [selectedEdge.source, selectedEdge.target]);
    if (bounds == null) {
      setAnchor(null);
      return;
    }
    setAnchor({
      left: bounds.left + bounds.width / 2,
      top: bounds.top - TOOLBAR_GAP_PX,
    });
  }, [selectedEdge, wrapperRef]);

  useLayoutEffect(() => {
    updateAnchor();
  }, [updateAnchor, nodes, edges]);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    if (wrapper == null || selectedEdge == null) {
      return;
    }
    const observer = new ResizeObserver(() => updateAnchor());
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [selectedEdge, updateAnchor, wrapperRef]);

  if (selectedEdge == null || anchor == null) {
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
      className="pointer-events-none absolute z-30"
      style={{
        left: anchor.left,
        top: anchor.top,
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
          hint={portType ? `Delete ${portType} wire` : "Delete wire"}
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
