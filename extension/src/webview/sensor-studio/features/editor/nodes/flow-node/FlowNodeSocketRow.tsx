import type { HTMLAttributes, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export type FlowNodeSocketRowVariant = "input" | "output";

export type FlowNodeSocketRowProps = HTMLAttributes<HTMLDivElement> & {
  variant: FlowNodeSocketRowVariant;
  /** Text or rich content beside the socket (port label). */
  label: ReactNode;
  /** Typically `<Handle />` optionally wrapped by `FlowNodeSocketDot`. */
  socket: ReactNode;
};

/**
 * One logical pin row: input = socket on the left; output = socket on the right (Blender-like).
 * Parents should render React Flow `Handle` inside `socket` with positioning classes
 * so the handle aligns to this row (see `StudioNodeCard`).
 */
export function FlowNodeSocketRow(props: FlowNodeSocketRowProps) {
  const { variant, label, socket, className, ...rest } = props;
  const row =
    variant === "input" ? (
      <div className="flex min-h-[24px] w-fit max-w-full min-w-0 items-center gap-2">
        <div className="relative flex h-6 w-5 shrink-0 items-center justify-start">{socket}</div>
        <div className="min-w-0 text-[11px] leading-tight text-zinc-300">{label}</div>
      </div>
    ) : (
      <div className="flex min-h-[24px] w-fit max-w-full min-w-0 items-center gap-2">
        <div className="min-w-0 shrink text-right text-[11px] leading-tight text-zinc-300">{label}</div>
        <div className="relative flex h-6 w-5 shrink-0 items-center justify-end">{socket}</div>
      </div>
    );

  return (
    <div
      className={twMerge(
        "relative",
        variant === "output" ? "self-end" : "self-start",
        className,
      )}
      {...rest}
    >
      {row}
    </div>
  );
}
