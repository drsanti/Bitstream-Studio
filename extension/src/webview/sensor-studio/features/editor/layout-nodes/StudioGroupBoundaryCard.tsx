import { memo, useCallback, useMemo } from "react";
import type { NodeProps } from "@xyflow/react";
import { LogIn } from "lucide-react";
import { useFlowCanvasPreferences } from "../components/use-flow-canvas-preferences";
import { flowNodeHandleStyle } from "../nodes/flow-node/flow-node-handle-style";
import {
  isFlowHandleWired,
  studioHandleBaseClass,
} from "../nodes/flow-node/flow-node-handle-chrome";
import type { StudioGroupBoundaryData } from "../subgraphs/studio-subgraph.types";
import { useFlowEditorStore } from "../store/flow-editor.store";
import { isSocketValuesVisible } from "../nodes/flow-node/socket-display";
import { GroupBoundarySocketRows } from "./GroupBoundarySocketRows";
import { useRefreshGroupBoundaryNodeInternals } from "./use-refresh-group-boundary-node-internals";
import { SubgraphFlowNodeShell } from "./SubgraphFlowNodeShell";

type StudioGroupBoundaryCardProps = NodeProps & {
  role: "input" | "output";
  icon: typeof LogIn;
  title: string;
};

export const StudioGroupBoundaryCard = memo(function StudioGroupBoundaryCard(
  props: StudioGroupBoundaryCardProps,
) {
  const { id, selected, role, icon: Icon, title } = props;
  const data = props.data as StudioGroupBoundaryData;
  const iface = data.interface;
  const sockets = role === "input" ? (iface?.inputs ?? []) : (iface?.outputs ?? []);
  const socketIds = useMemo(() => sockets.map((s) => s.id), [sockets]);
  const measureKey = useMemo(
    () =>
      [
        role,
        sockets.map((s) => `${s.id}:${s.label}:${s.portType}`).join("|"),
        JSON.stringify(data.liveNumberByHandle ?? {}),
        JSON.stringify(data.liveBooleanByHandle ?? {}),
        JSON.stringify(data.liveStringByHandle ?? {}),
      ].join("\n"),
    [data.liveBooleanByHandle, data.liveNumberByHandle, data.liveStringByHandle, role, sockets],
  );

  const edges = useFlowEditorStore((s) => s.edges);
  const socketValuesVisible = isSocketValuesVisible(undefined);

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
      kind="group-boundary"
      selected={Boolean(selected)}
      measureKey={measureKey}
      ariaLabel={title}
      socketLivePreviewsVisible={socketValuesVisible}
      className={[
        "studio-group-boundary",
        role === "input" ? "studio-group-boundary--input" : "studio-group-boundary--output",
        selected ? "studio-group-boundary--selected" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      header={
        <div
          data-flow-node-header
          className="studio-group-boundary__header node-drag-handle"
          data-flow-node-header-measure
        >
          <span data-flow-node-header-leading>
            <Icon
              size={12}
              strokeWidth={2.25}
              aria-hidden
              className="studio-group-boundary__icon"
            />
          </span>
          <span data-flow-node-header-primary className="studio-group-boundary__title">
            {title}
          </span>
        </div>
      }
      body={
        <div className="studio-group-boundary__body nodrag min-w-0 w-full max-w-full overflow-visible py-1.5 pl-0 pr-0">
          <GroupBoundarySocketRows
            role={role}
            sockets={sockets}
            boundaryData={data}
            socketValuesVisible={socketValuesVisible}
            handleBaseClass={handleBaseClass}
            mergeHandleStyle={mergeHandleStyle}
          />
        </div>
      }
    />
  );
});
