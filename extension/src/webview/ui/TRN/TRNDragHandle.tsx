import type { ButtonHTMLAttributes } from "react";
import { GripVertical } from "lucide-react";
import { useTRNDragHandleContext } from "./TRNSortableItem.js";

export type TRNDragHandleProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  hideIcon?: boolean;
};

export function TRNDragHandle(props: TRNDragHandleProps) {
  const { hideIcon = false, className, children, disabled, ...buttonProps } = props;
  const context = useTRNDragHandleContext();
  const isDisabled = disabled || context.disabled;

  return (
    <button
      ref={context.setActivatorNodeRef}
      type="button"
      className={
        "inline-flex items-center justify-center rounded p-1 text-zinc-400 " +
        "-ml-1 hover:bg-zinc-800/70 cursor-grab active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50 " +
        (className ?? "")
      }
      disabled={isDisabled}
      aria-label="Drag item"
      title="Drag item"
      {...context.attributes}
      {...context.listeners}
      {...buttonProps}
    >
      {children ?? (hideIcon ? null : <GripVertical className="h-4 w-4" />)}
    </button>
  );
}
