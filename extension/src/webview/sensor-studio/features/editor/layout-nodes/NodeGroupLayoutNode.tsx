import { memo, useCallback, useMemo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Box } from "lucide-react";
import { useFlowCanvasPreferences } from "../components/use-flow-canvas-preferences";
import { FlowNodeSocketRegion } from "../nodes/flow-node/FlowNodeSocketRegion";
import { FlowNodeSocketRow } from "../nodes/flow-node/FlowNodeSocketRow";
import { FlowNodeSocketDot } from "../nodes/flow-node/FlowNodeSocketDot";
import { flowNodeHandleStyle } from "../nodes/flow-node/flow-node-handle-style";
import {
  isFlowHandleWired,
  studioHandleBaseClass,
} from "../nodes/flow-node/flow-node-handle-chrome";
import { isSocketValuesVisible } from "../nodes/flow-node/socket-display";
import { studioPortAccent } from "../nodes/port-accent";
import type { StudioNodeGroupData } from "../subgraphs/studio-subgraph.types";
import { useFlowEditorStore } from "../store/flow-editor.store";
import { groupShellSocketPreview } from "./group-shell-socket-preview";
import { useRefreshGroupBoundaryNodeInternals } from "./use-refresh-group-boundary-node-internals";
import { SubgraphFlowNodeShell } from "./SubgraphFlowNodeShell";

export const NodeGroupLayoutNode = memo(function NodeGroupLayoutNode(props: NodeProps) {
  const { id, selected } = props;
  const propsData = props.data as StudioNodeGroupData;
  const liveData = useFlowEditorStore((s) => {
    const node = s.nodes.find((n) => n.id === id) ?? s.rootNodes.find((n) => n.id === id);
    return (node?.data ?? propsData) as StudioNodeGroupData;
  });
  const subgraphs = useFlowEditorStore((s) => s.subgraphs);
  const edges = useFlowEditorStore((s) => s.edges);
  const sub = subgraphs[liveData.subgraphId ?? id];
  const iface = sub?.interface;
  const title = liveData.graphTitle?.trim() || sub?.graphTitle?.trim() || "Node Group";
  const inputs = iface?.inputs ?? [];
  const outputs = iface?.outputs ?? [];
  const socketValuesVisible = isSocketValuesVisible(undefined);
  const socketIds = useMemo(
    () => [...inputs.map((s) => s.id), ...outputs.map((s) => s.id)],
    [inputs, outputs],
  );
  const measureKey = useMemo(
    () =>
      [
        title,
        socketValuesVisible ? "live-on" : "live-off",
        inputs.map((s) => `${s.id}:${s.label}:${s.portType}`).join("|"),
        outputs.map((s) => `${s.id}:${s.label}:${s.portType}`).join("|"),
        JSON.stringify(liveData.liveNumberByHandle ?? {}),
        JSON.stringify(liveData.liveBooleanByHandle ?? {}),
      ].join("\n"),
    [inputs, liveData.liveBooleanByHandle, liveData.liveNumberByHandle, outputs, socketValuesVisible, title],
  );

  const canvasPrefs = useFlowCanvasPreferences();
  const handleBaseClass = studioHandleBaseClass(
    canvasPrefs.handleSizePx,
    canvasPrefs.handleBorderWidthPx,
  );

  useRefreshGroupBoundaryNodeInternals(id, socketIds);

  const mergeHandleStyle = useCallback(
    (
      side: "left" | "right",
      accent: string,
      handleId: string,
      handleType: "source" | "target",
    ) => {
      const dimmed =
        canvasPrefs.handleDimWhenUnwired &&
        !isFlowHandleWired({
          nodeId: id,
          handleId,
          handleType,
          edges,
        });
      return {
        ...flowNodeHandleStyle(side, accent),
        opacity: dimmed ? 0.45 : 1,
      };
    },
    [canvasPrefs.handleDimWhenUnwired, edges, id],
  );

  return (
    <SubgraphFlowNodeShell
      nodeId={id}
      kind="node-group"
      selected={Boolean(selected)}
      measureKey={measureKey}
      ariaLabel={title}
      socketLivePreviewsVisible={socketValuesVisible}
      className={`studio-node-group node-drag-handle ${selected ? "studio-node-group--selected" : ""}`}
      header={
        <div
          data-flow-node-header
          className="studio-node-group__header"
          data-flow-node-header-measure
        >
          <span data-flow-node-header-leading>
            <Box
              size={12}
              strokeWidth={2.25}
              aria-hidden
              className="studio-node-group__icon"
            />
          </span>
          <span data-flow-node-header-primary className="studio-node-group__title">
            {title}
          </span>
        </div>
      }
      body={
        <div className="studio-node-group__body nodrag min-w-0 w-full max-w-full overflow-visible pl-0 pr-0">
          {inputs.length > 0 ? (
            <FlowNodeSocketRegion
              equalizeLabelWidth
              data-subgraph-socket-region
              className="studio-node-group__socket-region studio-node-group__socket-region--in grid gap-x-1 gap-y-0.5 grid-cols-[0_max-content_max-content]"
            >
              {inputs.map((sock) => {
                const accent = studioPortAccent(sock.portType);
                return (
                  <FlowNodeSocketRow
                    key={sock.id}
                    variant="input"
                    alignedInputColumns
                    label={sock.label}
                    trailingPreview={groupShellSocketPreview({
                      socket: sock,
                      liveData,
                      socketValuesVisible,
                    })}
                    socket={
                      <FlowNodeSocketDot>
                        <Handle
                          id={sock.id}
                          type="target"
                          position={Position.Left}
                          className={handleBaseClass}
                          style={mergeHandleStyle("left", accent, sock.id, "target")}
                        />
                      </FlowNodeSocketDot>
                    }
                  />
                );
              })}
            </FlowNodeSocketRegion>
          ) : null}
          {outputs.length > 0 ? (
            <FlowNodeSocketRegion
              data-subgraph-socket-region
              className="studio-node-group__socket-region studio-node-group__socket-region--out w-full max-w-full gap-x-0"
              alignedOutputColumns
              alignedOutputMetadataColumns
              equalizeLabelWidth
              showLivePreviewColumn={false}
            >
              {outputs.map((sock) => {
                const accent = studioPortAccent(sock.portType);
                return (
                  <FlowNodeSocketRow
                    key={sock.id}
                    variant="output"
                    alignedOutputColumns
                    leadingPreview={groupShellSocketPreview({
                      socket: sock,
                      liveData,
                      socketValuesVisible,
                    })}
                    leadingPreviewAlign="start"
                    label={sock.label}
                    socket={
                      <FlowNodeSocketDot>
                        <Handle
                          id={sock.id}
                          type="source"
                          position={Position.Right}
                          className={handleBaseClass}
                          style={mergeHandleStyle("right", accent, sock.id, "source")}
                        />
                      </FlowNodeSocketDot>
                    }
                  />
                );
              })}
            </FlowNodeSocketRegion>
          ) : null}
        </div>
      }
    />
  );
});
