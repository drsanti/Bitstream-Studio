import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { TRN_INSPECTOR_CONTEXT_BAR_WRAP_CLASS } from "./trn-inspector-panel-shell";

export type TRNInspectorContextBarProps = {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  iconShellClass?: string;
  trailing?: ReactNode;
  className?: string;
};

const DEFAULT_ICON_SHELL_CLASS =
  "border-zinc-600/35 bg-zinc-900/45 text-zinc-300/95";

export function TRNInspectorContextBar(props: TRNInspectorContextBarProps) {
  const {
    title,
    subtitle,
    icon: Icon,
    iconShellClass = DEFAULT_ICON_SHELL_CLASS,
    trailing,
    className,
  } = props;

  return (
    <div className={twMerge(TRN_INSPECTOR_CONTEXT_BAR_WRAP_CLASS, className)}>
      <div className="flex min-w-0 items-start gap-2">
        <span
          className={twMerge(
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
            iconShellClass,
          )}
          aria-hidden
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex min-w-0 items-baseline justify-between gap-2">
            <div className="truncate text-[11px] font-semibold tracking-wide text-zinc-100/95">
              {title}
            </div>
            {trailing}
          </div>
          {subtitle != null && subtitle.length > 0 ? (
            <p className="truncate text-[10px] leading-snug text-zinc-500">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
