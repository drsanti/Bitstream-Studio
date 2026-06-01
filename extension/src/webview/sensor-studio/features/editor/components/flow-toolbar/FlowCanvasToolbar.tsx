import { useCallback, useMemo } from "react";
import { Target, Trash2, Wand2 } from "lucide-react";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import {
  getSocketValuesVisibleUIState,
  getSocketsExpandedUIState,
  graphSocketToolbarNodeIds,
} from "../../nodes/flow-node/socket-display";
import {
  FLOW_TOOLBAR_DIVIDER_CLASS,
  FLOW_TOOLBAR_PILL_CLASS,
  flowToolbarBtnClass,
  flowToolbarDangerBtnClass,
} from "./flow-toolbar-tokens";
import { SocketDisplayToggle, SocketValuesToggle } from "./FlowToolbarToggles";

export type FlowCanvasToolbarProps = {
  onFitAll: () => void;
  onFitAllAndRemember?: () => void;
};

export function FlowCanvasToolbar(props: FlowCanvasToolbarProps) {
  const { onFitAll } = props;
  const nodes = useFlowEditorStore((s) => s.nodes);
  const applyFlowAutoLayout = useFlowEditorStore((s) => s.applyFlowAutoLayout);
  const resetCanvas = useFlowEditorStore((s) => s.resetCanvas);
  const toggleSocketsExpandedForNodes = useFlowEditorStore((s) => s.toggleSocketsExpandedForNodes);
  const toggleSocketValuesVisibleForNodes = useFlowEditorStore(
    (s) => s.toggleSocketValuesVisibleForNodes,
  );

  const graphNodeIds = useMemo(() => graphSocketToolbarNodeIds(nodes), [nodes]);
  const showSocketControls = graphNodeIds.length > 0;

  const graphSocketsExpanded = useMemo(
    () => getSocketsExpandedUIState(nodes, graphNodeIds),
    [nodes, graphNodeIds],
  );
  const graphSocketValuesVisible = useMemo(
    () => getSocketValuesVisibleUIState(nodes, graphNodeIds),
    [nodes, graphNodeIds],
  );

  const onLayout = useCallback(
    (direction: "LR" | "TB") => {
      applyFlowAutoLayout(direction);
      window.setTimeout(() => onFitAll(), 50);
    },
    [applyFlowAutoLayout, onFitAll],
  );

  const onClear = useCallback(() => {
    const ok = window.confirm(
      "Clear the flow canvas? All nodes and connections in the current graph will be removed. You can undo with Ctrl+Z.",
    );
    if (!ok) {
      return;
    }
    resetCanvas();
  }, [resetCanvas]);

  if (nodes.length === 0) {
    return null;
  }

  return (
    <div
      className={`${FLOW_TOOLBAR_PILL_CLASS} absolute left-1/2 top-3 z-20 -translate-x-1/2`}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className={flowToolbarBtnClass()}
        title="Auto-layout (horizontal)"
        aria-label="Auto-layout horizontal"
        onClick={() => onLayout("LR")}
      >
        <Wand2 size={14} />
      </button>
      <button
        type="button"
        className={flowToolbarBtnClass()}
        title="Auto-layout (vertical)"
        aria-label="Auto-layout vertical"
        onClick={() => onLayout("TB")}
      >
        <Wand2 size={14} className="rotate-90" />
      </button>
      <div className={FLOW_TOOLBAR_DIVIDER_CLASS} />
      <button
        type="button"
        className={flowToolbarBtnClass()}
        title="Fit entire graph (Shift+F or Home)"
        aria-label="Fit entire graph"
        onClick={onFitAll}
      >
        <Target size={14} />
      </button>
      {showSocketControls ? (
        <>
          <div className={FLOW_TOOLBAR_DIVIDER_CLASS} />
          <SocketValuesToggle
            pressed={graphSocketValuesVisible}
            onToggle={() => toggleSocketValuesVisibleForNodes(graphNodeIds)}
            title={
              graphSocketValuesVisible
                ? "Hide socket values on all nodes (Shift+V)"
                : "Show socket values on all nodes (Shift+V)"
            }
            ariaLabel={
              graphSocketValuesVisible ? "Hide socket values on all nodes" : "Show socket values on all nodes"
            }
          />
          <SocketDisplayToggle
            pressed={graphSocketsExpanded}
            onToggle={() => toggleSocketsExpandedForNodes(graphNodeIds)}
            title={
              graphSocketsExpanded
                ? "Collapse unwired sockets on all nodes (Shift+H)"
                : "Expand all sockets on all nodes (Shift+H)"
            }
            ariaLabel={
              graphSocketsExpanded ? "Collapse sockets on all nodes" : "Expand sockets on all nodes"
            }
          />
        </>
      ) : null}
      <div className={FLOW_TOOLBAR_DIVIDER_CLASS} />
      <button
        type="button"
        className={flowToolbarDangerBtnClass()}
        title="Clear graph"
        aria-label="Clear graph"
        onClick={onClear}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
