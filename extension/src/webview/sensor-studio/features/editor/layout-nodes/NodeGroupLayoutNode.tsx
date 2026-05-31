import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Box } from "lucide-react";
import type { StudioNodeGroupData } from "../subgraphs/studio-subgraph.types";
import { studioPortAccent } from "../nodes/port-accent";
import { flowNodeHandleStyle } from "../nodes/flow-node/flow-node-handle-style";
import { useFlowEditorStore } from "../store/flow-editor.store";

export const NodeGroupLayoutNode = memo(function NodeGroupLayoutNode(props: NodeProps) {
  const { id, selected } = props;
  const data = props.data as StudioNodeGroupData;
  const subgraphs = useFlowEditorStore((s) => s.subgraphs);
  const sub = subgraphs[data.subgraphId ?? id];
  const iface = sub?.interface;
  const title = data.graphTitle?.trim() || sub?.graphTitle?.trim() || "Node Group";
  const inputs = iface?.inputs ?? [];
  const outputs = iface?.outputs ?? [];

  return (
    <div
      className={`studio-node-group node-drag-handle ${selected ? "studio-node-group--selected" : ""}`}
      aria-label={title}
    >
      <div className="studio-node-group__header">
        <Box size={12} strokeWidth={2.25} aria-hidden className="studio-node-group__icon" />
        <span className="studio-node-group__title">{title}</span>
      </div>
      <div className="studio-node-group__body">
        <div className="studio-node-group__socket-col studio-node-group__socket-col--in">
          {inputs.map((sock, i) => {
            const accent = studioPortAccent(sock.portType);
            return (
              <div key={sock.id} className="studio-node-group__socket-row">
                <Handle
                  id={sock.id}
                  type="target"
                  position={Position.Left}
                  className="!h-2 !w-2 !border-2 !bg-zinc-900"
                  style={{
                    ...flowNodeHandleStyle("left", accent),
                    top: `${((i + 1) / (inputs.length + 1)) * 100}%`,
                  }}
                />
                <span className="studio-node-group__socket-label">{sock.label}</span>
              </div>
            );
          })}
        </div>
        <div className="studio-node-group__socket-col studio-node-group__socket-col--out">
          {outputs.map((sock, i) => {
            const accent = studioPortAccent(sock.portType);
            return (
              <div key={sock.id} className="studio-node-group__socket-row studio-node-group__socket-row--out">
                <span className="studio-node-group__socket-label">{sock.label}</span>
                <Handle
                  id={sock.id}
                  type="source"
                  position={Position.Right}
                  className="!h-2 !w-2 !border-2 !bg-zinc-900"
                  style={{
                    ...flowNodeHandleStyle("right", accent),
                    top: `${((i + 1) / (outputs.length + 1)) * 100}%`,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
      <span className="sr-only">{id}</span>
    </div>
  );
});
