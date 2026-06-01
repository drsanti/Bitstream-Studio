import { memo, useCallback, useEffect, useRef, useState } from "react";
import { NodeResizer, type NodeProps } from "@xyflow/react";
import { Frame as FrameIcon } from "lucide-react";
import type { FrameLayoutNodeData } from "../layout/layout-flow-nodes.types";
import { useFlowEditorStore } from "../store/flow-editor.store";

export const FrameLayoutNode = memo(function FrameLayoutNode(props: NodeProps) {
  const { id, selected } = props;
  const data = props.data as FrameLayoutNodeData;
  const label = typeof data.label === "string" && data.label.trim().length > 0 ? data.label : "Frame";
  const updateLayoutNodeData = useFlowEditorStore((s) => s.updateLayoutNodeData);
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!editing) {
      return;
    }
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editing]);

  const onLabelChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      updateLayoutNodeData(id, { label: event.target.value });
    },
    [id, updateLayoutNodeData],
  );

  return (
    <div
      className={`studio-frame-node group/frame relative h-full w-full min-h-[120px] min-w-[200px] ${selected ? "studio-frame-node--selected" : ""}`}
    >
      <NodeResizer
        minWidth={200}
        minHeight={120}
        isVisible={Boolean(selected)}
        lineClassName="studio-frame-node-resizer-line"
        handleClassName="studio-frame-node-resizer-handle"
      />
      <div className="studio-frame-node__surface pointer-events-none absolute inset-0 z-[2] rounded-xl" />
      <div
        className="studio-frame-node__header relative z-[3] flex h-7 cursor-move items-center gap-1.5 rounded-t-xl px-2.5"
        onDoubleClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
      >
        <FrameIcon size={12} className="shrink-0 text-zinc-400" aria-hidden />
        {editing ? (
          <input
            ref={inputRef}
            value={label}
            onChange={onLabelChange}
            onBlur={() => setEditing(false)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                setEditing(false);
              } else if (event.key === "Escape") {
                setEditing(false);
              }
            }}
            className="nodrag nopan pointer-events-auto min-w-0 flex-1 cursor-text bg-transparent text-[10px] font-semibold uppercase tracking-wider text-zinc-300 outline-none"
            placeholder="Frame"
          />
        ) : (
          <div
            className="nodrag nopan pointer-events-auto min-w-0 flex-1 select-none truncate text-[10px] font-semibold uppercase tracking-wider text-zinc-300"
            title="Double-click to rename"
          >
            {label}
          </div>
        )}
      </div>
    </div>
  );
});
