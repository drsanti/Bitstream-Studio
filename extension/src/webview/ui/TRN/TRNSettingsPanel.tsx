import type { HTMLAttributes, ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export type TRNSettingsPanelProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  description?: string;
  icon?: ReactNode;
  rightSlot?: ReactNode;
  children?: ReactNode;
  collapsed?: boolean;
};

export function TRNSettingsPanel({
  title,
  description,
  icon,
  rightSlot,
  children,
  className = "",
  collapsed = false,
  ...divProps
}: TRNSettingsPanelProps) {
  return (
    <section
      className={
        "rounded-2xl border border-zinc-700/80 bg-linear-to-br from-zinc-900/90 to-zinc-800/75 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.22)] backdrop-blur-md " +
        className
      }
      {...divProps}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {icon != null ? (
            <span className="inline-flex h-5 w-5 items-center justify-center text-zinc-400">
              {icon}
            </span>
          ) : null}
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-zinc-100">
              {title}
            </h3>
            {description != null ? (
              <p className="mt-0.5 text-sm text-zinc-400">{description}</p>
            ) : null}
          </div>
        </div>
        {rightSlot != null ? (
          rightSlot
        ) : (
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-700/80 bg-zinc-900/80 text-zinc-400"
            aria-label={collapsed ? "Expand panel" : "Collapse panel"}
          >
            <ChevronDown
              className="h-4 w-4 transition-transform"
              style={{
                transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
              }}
            />
          </button>
        )}
      </div>
      {collapsed ? null : children}
    </section>
  );
}
