import { memo, useMemo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Split } from "lucide-react";
import {
  clampSplitOutputCount,
  splitOutputHandleIds,
  type SplitLayoutNodeData,
} from "../layout/layout-flow-nodes.types";
import { studioPortAccent } from "../nodes/port-accent";
import { flowNodeHandleStyle } from "../nodes/flow-node/flow-node-handle-style";

export const SplitLayoutNode = memo(function SplitLayoutNode(props: NodeProps) {
  const { selected } = props;
  const data = props.data as SplitLayoutNodeData;
  const outputCount = clampSplitOutputCount(data.outputCount);
  const socketType = data.socketType ?? "number";
  const accent = studioPortAccent(socketType);
  const outputs = useMemo(() => splitOutputHandleIds(outputCount), [outputCount]);

  return (
    <div
      className={`studio-split-node rounded-lg border border-zinc-700/80 bg-zinc-950/90 px-2 py-2 ${selected ? "ring-1 ring-cyan-500/40" : ""}`}
      style={{ minWidth: 120 }}
    >
      <div className="node-drag-handle mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-300">
        <Split size={12} className="text-zinc-400" aria-hidden />
        Split
        <span className="ml-auto text-zinc-500">{outputCount}×</span>
      </div>
      <Handle
        id="in"
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !border-2 !bg-zinc-900"
        style={flowNodeHandleStyle("left", accent)}
      />
      <div className="relative space-y-1 pl-3">
        {outputs.map((handleId, index) => (
          <div key={handleId} className="relative flex h-5 items-center justify-end pr-1 text-[9px] text-zinc-500">
            {index + 1}
            <Handle
              id={handleId}
              type="source"
              position={Position.Right}
              className="!h-2 !w-2 !border-2 !bg-zinc-900"
              style={{
                ...flowNodeHandleStyle("right", accent),
                top: `${((index + 1) / (outputCount + 1)) * 100}%`,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
});
