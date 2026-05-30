import type { ReactNode } from "react";

type TRNStatusState = "ok" | "warn" | "error" | "idle";

type TRNStatusIconProps = {
  icon: ReactNode;
  state: TRNStatusState;
  label: string;
  title?: string;
  className?: string;
};

function colorClassForState(state: TRNStatusState): string {
  if (state === "ok") {
    return "text-emerald-400";
  }
  if (state === "error") {
    return "text-rose-400";
  }
  if (state === "warn") {
    return "text-amber-400";
  }
  return "text-zinc-400";
}

export function TRNStatusIcon({
  icon,
  state,
  label,
  title,
  className = "",
}: TRNStatusIconProps) {
  return (
    <div
      className={
        "inline-flex items-center rounded-md bg-zinc-800/70 px-1 py-1 " +
        className
      }
    >
      <span
        className={"inline-flex items-center " + colorClassForState(state)}
        aria-label={label}
        title={title ?? label}
      >
        {icon}
      </span>
    </div>
  );
}
