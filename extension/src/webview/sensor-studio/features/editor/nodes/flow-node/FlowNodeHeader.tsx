import type { HTMLAttributes, ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import type { FlowNodeGlassPreset } from "./theme/flow-node-glass";
import { flowNodeHeaderGlassClass } from "./theme/flow-node-glass";

export type FlowNodeHeaderProps = HTMLAttributes<HTMLDivElement> & {
  /** Title text; pair with `leading` (icon) on the left cluster and `trailing` (badges) on the right. */
  primary: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  /** Glass strip behind the title row (matches TRN card header). */
  glass?: boolean;
  glassPreset?: FlowNodeGlassPreset;
};

export function FlowNodeHeader(props: FlowNodeHeaderProps) {
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
      className={twMerge(
        "flex min-w-0 w-full items-center justify-between gap-2 overflow-hidden rounded-t-md border-b border-zinc-700/80 px-2.5 py-1.5",
        glass
          ? `bg-linear-to-r ${flowNodeHeaderGlassClass(glassPreset)}`
          : "bg-linear-to-r from-zinc-900/95 to-zinc-800/75",
        className,
      )}
      {...rest}
    >
      <div
        className="flex min-w-0 flex-1 items-center gap-2"
        data-flow-node-header-leading
      >
        {leading != null ? (
          <span className="inline-flex shrink-0 items-center">{leading}</span>
        ) : null}
        <div className="min-w-0 w-max max-w-full" data-flow-node-header-primary>
          {primary}
        </div>
      </div>
      <div
        className="inline-flex shrink-0 items-center justify-end gap-1.5"
        data-flow-node-header-trailing
      >
        {trailing}
      </div>
    </div>
  );
}
