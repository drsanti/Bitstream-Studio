import { Handle, Position } from "@xyflow/react";
import { formatFlowPortTypeLabel } from "../edges/flow-edge-port-label";
import { FlowNodeSocketDot } from "../nodes/flow-node/FlowNodeSocketDot";
import { FlowNodeSocketRegion } from "../nodes/flow-node/FlowNodeSocketRegion";
import { FlowNodeSocketRow } from "../nodes/flow-node/FlowNodeSocketRow";
import { StudioPortTypeMenuIcon } from "../nodes/studio-port-type-menu-icon";
import { studioPortAccent } from "../nodes/port-accent";
import type { StudioPortType } from "../store/flow-editor.store";
import type {
  StudioGroupBoundaryData,
  StudioGroupSocketDef,
} from "../subgraphs/studio-subgraph.types";
import { groupBoundarySocketLivePreview } from "./group-boundary-socket-live-preview";

type GroupBoundarySocketRowsProps = {
  role: "input" | "output";
  sockets: StudioGroupSocketDef[];
  boundaryData: StudioGroupBoundaryData;
  socketValuesVisible: boolean;
  handleBaseClass: string;
  mergeHandleStyle: (
    side: "left" | "right",
    accent: string,
    handleId: string,
    handleType: "source" | "target",
  ) => { borderColor: string; opacity?: number };
};

function BoundarySocketTypeChip(props: { portType: string }) {
  const portType = props.portType as StudioPortType;
  return (
    <span className="studio-group-boundary__type-chip inline-flex shrink-0 items-center gap-0.5">
      <StudioPortTypeMenuIcon portType={portType} />
      <span className="max-w-18 truncate text-[9px] uppercase tracking-wide text-zinc-500">
        {formatFlowPortTypeLabel(portType)}
      </span>
    </span>
  );
}

function boundaryInputLeadingPreview(
  data: StudioGroupBoundaryData,
  sock: StudioGroupSocketDef,
  socketValuesVisible: boolean,
) {
  const live = groupBoundarySocketLivePreview(
    data,
    sock.id,
    sock.portType as StudioPortType,
    sock.label,
    socketValuesVisible,
  );
  if (live != null) {
    return live;
  }
  return <BoundarySocketTypeChip portType={sock.portType} />;
}

export function GroupBoundarySocketRows(props: GroupBoundarySocketRowsProps) {
  const {
    role,
    sockets,
    boundaryData,
    socketValuesVisible,
    handleBaseClass,
    mergeHandleStyle,
  } = props;

  if (sockets.length === 0) {
    return (
      <p className="studio-group-boundary__empty px-2.5 py-3 text-center text-[10px] leading-relaxed text-zinc-500">
        No {role === "input" ? "inputs" : "outputs"} yet.
        <br />
        Wire a node or add sockets in the Inspector.
      </p>
    );
  }

  if (role === "input") {
    return (
      <FlowNodeSocketRegion
        data-subgraph-socket-region
        className="studio-group-boundary__socket-region studio-group-boundary__socket-region--in w-full max-w-full"
        equalizeLabelWidth={socketValuesVisible}
        showLivePreviewColumn={socketValuesVisible}
        alignRowsToEnd
      >
        {sockets.map((sock) => {
          const accent = studioPortAccent(sock.portType);
          const leadingPreview = boundaryInputLeadingPreview(
            boundaryData,
            sock,
            socketValuesVisible,
          );
          return (
            <FlowNodeSocketRow
              key={sock.id}
              variant="output"
              leadingPreview={leadingPreview}
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
    );
  }

  return (
    <FlowNodeSocketRegion
      data-subgraph-socket-region
      className={[
        "studio-group-boundary__socket-region studio-group-boundary__socket-region--out grid gap-x-1 gap-y-0.5",
        socketValuesVisible
          ? "grid-cols-[0_max-content_max-content]"
          : "grid-cols-[0_max-content_0]",
      ].join(" ")}
      equalizeLabelWidth={socketValuesVisible}
      showLivePreviewColumn={socketValuesVisible}
    >
      {sockets.map((sock) => {
        const accent = studioPortAccent(sock.portType);
        return (
          <FlowNodeSocketRow
            key={sock.id}
            variant="input"
            alignedInputColumns
            label={sock.label}
            trailingPreview={<BoundarySocketTypeChip portType={sock.portType} />}
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
  );
}
