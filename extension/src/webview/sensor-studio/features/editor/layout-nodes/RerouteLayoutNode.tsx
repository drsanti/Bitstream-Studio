import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { GitMerge } from "lucide-react";
import type { RerouteLayoutNodeData } from "../layout/layout-flow-nodes.types";
import { studioPortAccent } from "../nodes/port-accent";
import { flowNodeHandleStyle } from "../nodes/flow-node/flow-node-handle-style";

export const RerouteLayoutNode = memo(function RerouteLayoutNode(props: NodeProps) {
  const { id, selected } = props;
  const data = props.data as RerouteLayoutNodeData;
  const accent = studioPortAccent(data.socketType ?? "number");

  return (
    <div
      className={`studio-reroute-junction node-drag-handle ${selected ? "studio-reroute-junction--selected" : ""}`}
      style={{ "--reroute-accent": accent } as React.CSSProperties}
      aria-label={data.socketType != null ? `Reroute, ${data.socketType}` : "Reroute"}
    >
      <div className="studio-reroute-junction__core" aria-hidden>
        <GitMerge size={11} strokeWidth={2.25} className="studio-reroute-junction__icon" />
      </div>
      <Handle
        id="in"
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !border-2 !bg-zinc-900"
        style={flowNodeHandleStyle("left", accent)}
      />
      <Handle
        id="out"
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !border-2 !bg-zinc-900"
        style={flowNodeHandleStyle("right", accent)}
      />
      <span className="sr-only">{id}</span>
    </div>
  );
});
