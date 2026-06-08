import type { ReactNode } from "react";
import { formatFlowPortTypeLabel } from "../edges/flow-edge-port-label";
import type { StudioPortType } from "../nodes/port-accent";
import type {
  StudioGroupSocketDef,
  StudioNodeGroupHostLiveFields,
} from "../subgraphs/studio-subgraph.types";
import { groupBoundarySocketLivePreview } from "./group-boundary-socket-live-preview";

export function GroupShellSocketTypeChip(props: { portType: string }) {
  return (
    <span
      data-subgraph-socket-type-chip
      className="shrink-0 whitespace-nowrap rounded bg-zinc-800/80 px-1 py-px text-[9px] uppercase tracking-wide text-zinc-500"
    >
      {formatFlowPortTypeLabel(props.portType)}
    </span>
  );
}

/** Number/boolean live readout when sim has a value; otherwise port-type chip. */
export function groupShellSocketPreview(args: {
  socket: StudioGroupSocketDef;
  liveData: StudioNodeGroupHostLiveFields;
  socketValuesVisible: boolean;
}): ReactNode {
  const { socket, liveData, socketValuesVisible } = args;
  if (socket.portType === "number" || socket.portType === "boolean") {
    const livePreview = groupBoundarySocketLivePreview(
      liveData,
      socket.id,
      socket.portType as StudioPortType,
      socket.label,
      socketValuesVisible,
    );
    if (livePreview != null) {
      return livePreview;
    }
  }
  return <GroupShellSocketTypeChip portType={socket.portType} />;
}
