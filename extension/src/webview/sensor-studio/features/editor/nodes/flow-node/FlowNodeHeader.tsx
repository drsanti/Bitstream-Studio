import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import type { FlowNodeGlassPreset } from "./theme/flow-node-glass";
import { flowNodeHeaderGlassClass } from "./theme/flow-node-glass";

export type FlowNodeHeaderProps = HTMLAttributes<HTMLDivElement> & {
  /** Node display name — left column beside `leading` icon. */
  primary: ReactNode;
  leading?: ReactNode;
  /** Status chips, mode badges — right column. */
  trailing?: ReactNode;
  /** Glass strip behind the title row (matches TRN card header). */
  glass?: boolean;
  glassPreset?: FlowNodeGlassPreset;
};

/**
 * Flow node title strip — one row, two columns.
 *
 * ```
 * ┌─ px-2.5 py-1.5 ────────────────────────────────────────────────┐
 * │  col 1 (left, shrink-0)                col 2 (right, shrink-0) │
 * │  [icon]  Node name                     chip  chip  …              │
 * └──────────────────────────────────────────────────────────────────┘
 * ```
 */
export const FlowNodeHeader = forwardRef<HTMLDivElement, FlowNodeHeaderProps>(
  function FlowNodeHeader(props, ref) {
    const {
      primary,
      leading,
      trailing,
      className,
      glass = true,
      glassPreset = "medium",
      ...rest
    } = props;
    return (
      <div
        ref={ref}
        data-flow-node-header
        className={twMerge(
          "flex min-w-0 w-full items-center overflow-hidden rounded-t-md border-b border-zinc-700/80 px-2.5 py-1.5",
          glass
            ? `bg-linear-to-r ${flowNodeHeaderGlassClass(glassPreset)}`
            : "bg-linear-to-r from-zinc-900/95 to-zinc-800/75",
          className,
        )}
        {...rest}
      >
        <div
          data-flow-node-header-measure
          className="flex w-full min-w-0 items-center justify-between gap-2"
        >
          <div
            className="flex shrink-0 items-center justify-start gap-2"
            data-flow-node-header-leading
          >
            {leading != null ? (
              <span
                className="inline-flex shrink-0 items-center"
                data-flow-node-header-icon
              >
                {leading}
              </span>
            ) : null}
            <span
              data-flow-node-header-primary
              className="shrink-0 whitespace-nowrap text-[13px] font-semibold leading-none tracking-tight text-zinc-100"
            >
              {primary}
            </span>
          </div>
          {trailing != null ? (
            <div
              className="inline-flex shrink-0 items-center justify-end gap-1.5"
              data-flow-node-header-trailing
            >
              {trailing}
            </div>
          ) : null}
        </div>
      </div>
    );
  },
);
