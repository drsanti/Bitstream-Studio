import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { LogIn } from "lucide-react";
import type { StudioGroupBoundaryData } from "../subgraphs/studio-subgraph.types";
import { studioPortAccent } from "../nodes/port-accent";
import { flowNodeHandleStyle } from "../nodes/flow-node/flow-node-handle-style";

export const GroupInputLayoutNode = memo(function GroupInputLayoutNode(props: NodeProps) {
  const data = props.data as StudioGroupBoundaryData;
  const inputs = data.interface?.inputs ?? [];

  return (
    <div className="studio-group-boundary studio-group-boundary--input" aria-label="Group Input">
      <div className="studio-group-boundary__title">
        <LogIn size={12} strokeWidth={2.25} aria-hidden />
        <span>Group Input</span>
      </div>
      <div className="studio-group-boundary__sockets">
        {inputs.map((sock, i) => {
          const accent = studioPortAccent(sock.portType);
          return (
            <div key={sock.id} className="studio-group-boundary__socket-row">
              <span className="studio-group-boundary__socket-label">{sock.label}</span>
              <Handle
                id={sock.id}
                type="source"
                position={Position.Right}
                className="!h-2 !w-2 !border-2 !bg-zinc-900"
                style={{
                  ...flowNodeHandleStyle("right", accent),
                  top: `${((i + 1) / (inputs.length + 1)) * 100}%`,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});
