import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { LogOut } from "lucide-react";
import type { StudioGroupBoundaryData } from "../subgraphs/studio-subgraph.types";
import { studioPortAccent } from "../nodes/port-accent";
import { flowNodeHandleStyle } from "../nodes/flow-node/flow-node-handle-style";

export const GroupOutputLayoutNode = memo(function GroupOutputLayoutNode(props: NodeProps) {
  const data = props.data as StudioGroupBoundaryData;
  const outputs = data.interface?.outputs ?? [];

  return (
    <div className="studio-group-boundary studio-group-boundary--output" aria-label="Group Output">
      <div className="studio-group-boundary__title">
        <LogOut size={12} strokeWidth={2.25} aria-hidden />
        <span>Group Output</span>
      </div>
      <div className="studio-group-boundary__sockets">
        {outputs.map((sock, i) => {
          const accent = studioPortAccent(sock.portType);
          return (
            <div key={sock.id} className="studio-group-boundary__socket-row">
              <Handle
                id={sock.id}
                type="target"
                position={Position.Left}
                className="!h-2 !w-2 !border-2 !bg-zinc-900"
                style={{
                  ...flowNodeHandleStyle("left", accent),
                  top: `${((i + 1) / (outputs.length + 1)) * 100}%`,
                }}
              />
              <span className="studio-group-boundary__socket-label">{sock.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
});
