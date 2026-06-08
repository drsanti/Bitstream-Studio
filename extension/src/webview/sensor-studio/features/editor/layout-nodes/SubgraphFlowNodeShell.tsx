import { twMerge } from "tailwind-merge";
import { FlowNodeEdgeResize } from "../nodes/flow-node/FlowNodeEdgeResize";
import type { SubgraphFlowNodeKind } from "./subgraph-flow-node-min-dimensions";
import { useSubgraphFlowNodeShellSize } from "./use-subgraph-flow-node-shell-size";

export type SubgraphFlowNodeShellProps = {
  nodeId: string;
  kind: SubgraphFlowNodeKind;
  selected: boolean;
  measureKey: string;
  className?: string;
  ariaLabel?: string;
  /** When false, width math ignores live preview columns (boundary nodes). */
  socketLivePreviewsVisible?: boolean;
  header: React.ReactNode;
  body: React.ReactNode;
};

export function SubgraphFlowNodeShell(props: SubgraphFlowNodeShellProps) {
  const {
    nodeId,
    kind,
    selected,
    measureKey,
    className,
    ariaLabel,
    socketLivePreviewsVisible,
    header,
    body,
  } = props;
  const {
    shellRef,
    headerRef,
    bodyRef,
    resizeActive,
    minWidth,
    minHeight,
  } = useSubgraphFlowNodeShellSize({
    nodeId,
    kind,
    selected,
    measureKey,
    socketLivePreviewsVisible,
  });

  return (
    <div
      ref={shellRef}
      aria-label={ariaLabel}
      className={twMerge(
        "studio-flow-node-hit-target relative h-auto w-full min-h-0 min-w-0 overflow-visible",
        className,
      )}
    >
      <FlowNodeEdgeResize
        nodeId={nodeId}
        active={resizeActive}
        minWidth={minWidth}
        minHeight={minHeight}
        allowHeightResize={false}
        shellRef={shellRef}
      />
      <div ref={headerRef}>{header}</div>
      <div ref={bodyRef}>{body}</div>
    </div>
  );
}
