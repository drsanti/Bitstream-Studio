import { memo, useCallback } from "react";
import type { NodeProps } from "@xyflow/react";
import { StickyNote } from "lucide-react";
import type { NoteLayoutNodeData } from "../layout/layout-flow-nodes.types";
import { useFlowEditorStore } from "../store/flow-editor.store";

export const NoteLayoutNode = memo(function NoteLayoutNode(props: NodeProps) {
  const { id } = props;
  const data = props.data as NoteLayoutNodeData;
  const updateLayoutNodeData = useFlowEditorStore((s) => s.updateLayoutNodeData);

  const onLabelChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      updateLayoutNodeData(id, { label: event.target.value });
    },
    [id, updateLayoutNodeData],
  );

  const onTextChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateLayoutNodeData(id, { text: event.target.value });
    },
    [id, updateLayoutNodeData],
  );

  return (
    <div className="studio-note-node flex min-w-[180px] max-w-[280px] flex-col rounded-md">
      <div className="studio-note-node__header node-drag-handle flex cursor-move items-center gap-2 rounded-t-md px-3 py-2">
        <StickyNote size={11} className="shrink-0 text-yellow-500/70" aria-hidden />
        <input
          value={data.label ?? "Note"}
          onChange={onLabelChange}
          className="nodrag flex-1 bg-transparent text-[10px] font-bold uppercase tracking-wider text-yellow-300/80 outline-none"
          placeholder="Title…"
        />
      </div>
      <textarea
        value={data.text ?? ""}
        onChange={onTextChange}
        placeholder="Add a comment…"
        rows={3}
        className="nodrag resize-none bg-transparent px-3 py-2 text-[10px] leading-relaxed text-yellow-200/60 outline-none placeholder:text-yellow-900/60"
      />
    </div>
  );
});
