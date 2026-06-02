import type { HTMLAttributes, ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import type { FlowNodeGlassPreset } from "./theme/flow-node-glass";
import { flowNodeHeaderGlassClass } from "./theme/flow-node-glass";

export type FlowNodeHeaderProps = HTMLAttributes<HTMLDivElement> & {
  /** Category / small line above the title (optional). */
  subtitle?: ReactNode;
  /** Main title row (e.g. label + emphasis); use `leading` / `trailing` for icons and badges. */
  primary: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  /** Glass strip behind the title row (matches TRN card header). */
  glass?: boolean;
  glassPreset?: FlowNodeGlassPreset;
};

export function FlowNodeHeader(props: FlowNodeHeaderProps) {
  const {
    subtitle,
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
        "min-w-0 w-full overflow-hidden rounded-t-md border-b border-zinc-700/80 px-2 py-1",
        glass
          ? `bg-linear-to-r ${flowNodeHeaderGlassClass(glassPreset)}`
          : "bg-linear-to-r from-zinc-900/95 to-zinc-800/75",
        className,
      )}
      {...rest}
    >
      {subtitle != null ? (
        <div className="text-[11px] uppercase tracking-wide text-zinc-400">{subtitle}</div>
      ) : null}
      <div
        className={twMerge(
          "flex min-w-0 items-start justify-between gap-2",
          subtitle != null ? "mt-0.5" : null,
        )}
      >
        <div className="flex min-w-0 flex-1 items-start gap-2">
          {leading != null ? (
            <span className="inline-flex shrink-0 items-center">{leading}</span>
          ) : null}
          <div className="min-w-0 flex-1" data-flow-node-header-primary>
            {primary}
          </div>
        </div>
        {trailing != null ? (
          <div className="inline-flex shrink-0 items-center" data-flow-node-header-trailing>
            {trailing}
          </div>
        ) : null}
      </div>
    </div>
  );
}
