import type { HTMLAttributes, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export type FlowNodeSocketRowVariant = "input" | "output";

export type FlowNodeSocketRowProps = HTMLAttributes<HTMLDivElement> & {
  variant: FlowNodeSocketRowVariant;
  /** Text or rich content beside the socket (port label). */
  label: ReactNode;
  /** Typically `<Handle />` optionally wrapped by `FlowNodeSocketDot`. */
  socket: ReactNode;
  /**
   * Output rows: compact live readout before the port label (right-aligned toward the label).
   * Input rows: compact live readout immediately after the port label (`gap-1` cluster).
   */
  leadingPreview?: ReactNode;
  trailingPreview?: ReactNode;
  /** Share label column width across rows via parent subgrid ({@link FlowNodeSocketRegion}). */
  alignedOutputColumns?: boolean;
  /** Share label+preview column width across *input* rows via parent grid/subgrid. */
  alignedInputColumns?: boolean;
};

/**
 * One logical pin row: input = socket on the left; output = socket on the right (Blender-like).
 * Parents should render React Flow `Handle` inside `socket` with positioning classes
 * so the handle aligns to this row (see `StudioNodeCard`).
 */
export function FlowNodeSocketRow(props: FlowNodeSocketRowProps) {
  const {
    variant,
    label,
    socket,
    leadingPreview,
    trailingPreview,
    alignedOutputColumns = false,
    alignedInputColumns = false,
    className,
    ...rest
  } = props;

  if (variant === "input" && alignedInputColumns) {
    return (
      <div
        className={twMerge(
          "relative col-span-full grid w-full min-h-[24px] grid-cols-subgrid items-center overflow-visible",
          className,
        )}
        {...rest}
      >
        <div className="relative flex h-6 w-0 shrink-0 items-center justify-center">{socket}</div>
        <div
          data-flow-socket-label
          className="whitespace-nowrap pl-2 text-[11px] leading-tight text-zinc-300"
          style={{
            width: "var(--flow-socket-label-w, auto)",
          }}
        >
          {label}
        </div>
        <div className="nodrag flex min-w-0 items-center pl-1">
          {trailingPreview ?? null}
        </div>
      </div>
    );
  }

  if (variant === "output" && alignedOutputColumns) {
    return (
      <div
        className={twMerge(
          "relative col-span-full grid w-full min-h-[24px] grid-cols-subgrid items-center overflow-visible",
          className,
        )}
        {...rest}
      >
        <div className="nodrag flex min-w-0 justify-end">{leadingPreview ?? null}</div>
        <div className="whitespace-nowrap pl-2 pr-3 text-right text-[11px] leading-tight text-zinc-300">
          {label}
        </div>
        <div className="relative flex h-6 w-0 shrink-0 items-center justify-center">{socket}</div>
      </div>
    );
  }

  const row =
    variant === "input" ? (
      <div className="flex min-h-[24px] w-fit max-w-full min-w-0 items-center">
        <div className="relative flex h-6 w-0 shrink-0 items-center justify-center">{socket}</div>
        <div className="flex min-w-0 shrink-0 items-center gap-1 pl-2">
          <div className="whitespace-nowrap text-[11px] leading-tight text-zinc-300">{label}</div>
          {trailingPreview != null ? (
            <div className="nodrag shrink-0">{trailingPreview}</div>
          ) : null}
        </div>
      </div>
    ) : (
      <div
        className={
          leadingPreview != null
            ? "flex min-h-[24px] w-full min-w-0 max-w-full items-center gap-0.5"
            : "flex min-h-[24px] w-fit max-w-full min-w-0 items-center gap-1"
        }
      >
        {leadingPreview != null ? (
          <div className="nodrag flex min-w-0 flex-1 justify-end">{leadingPreview}</div>
        ) : null}
        <div
          className={
            leadingPreview != null
              ? "min-w-0 shrink-0 pl-2 pr-3 text-right text-[11px] leading-tight text-zinc-300"
              : "min-w-0 flex-1 truncate pl-2 pr-3 text-right text-[11px] leading-tight text-zinc-300"
          }
        >
          {label}
        </div>
        <div className="relative flex h-6 w-0 shrink-0 items-center justify-center">{socket}</div>
      </div>
    );

  return (
    <div
      className={twMerge(
        "relative",
        variant === "output"
          ? leadingPreview != null
            ? "w-full self-stretch"
            : "self-end"
          : "self-start",
        className,
      )}
      {...rest}
    >
      {row}
    </div>
  );
}
