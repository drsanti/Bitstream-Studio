import type { HTMLAttributes, ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import type { FlowNodeGlassPreset } from "./theme/flow-node-glass";
import { flowNodeShellGlassClass } from "./theme/flow-node-glass";
import { FLOW_NODE_MIN_WIDTH_CLASS } from "./theme/flow-node-tokens";

export type FlowNodeShellProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** When false, uses opaque shell closer to legacy node card. */
  glass?: boolean;
  glassPreset?: FlowNodeGlassPreset;
};

export function FlowNodeShell(props: FlowNodeShellProps) {
  const {
    children,
    className,
    glass = true,
    glassPreset = "medium",
    ...rest
  } = props;
  return (
    <div
      className={twMerge(
        FLOW_NODE_MIN_WIDTH_CLASS,
        "inline-flex min-w-0 max-w-full flex-col overflow-visible rounded-md border text-zinc-100 shadow-[0_8px_24px_rgba(0,0,0,0.35)]",
        glass ? flowNodeShellGlassClass(glassPreset) : "border-zinc-700/80 bg-zinc-950/85",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
