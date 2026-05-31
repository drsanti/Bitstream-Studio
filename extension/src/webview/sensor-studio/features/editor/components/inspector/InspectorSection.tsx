import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { twMerge } from "tailwind-merge";

export type InspectorSectionProps = {
  title: string;
  /** Muted subline under the title when expanded. */
  hint?: string;
  /** Optional actions on the section header row (right). */
  headerTrailing?: ReactNode;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  collapsible?: boolean;
  variant?: "default" | "error";
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

/**
 * Flat inspector section — instrument readout style (no glass TRNCard frame).
 */
export function InspectorSection(props: InspectorSectionProps) {
  const {
    title,
    hint,
    headerTrailing,
    defaultExpanded = true,
    onExpandedChange,
    collapsible = false,
    variant = "default",
    children,
    className = "",
    contentClassName = "px-2.5 py-2",
  } = props;

  const [expanded, setExpanded] = useState(defaultExpanded);
  const isOpen = collapsible ? expanded : true;

  const setOpen = (next: boolean) => {
    if (collapsible) {
      setExpanded(next);
      onExpandedChange?.(next);
    }
  };

  const headerInner = (
    <>
      <span
        className={twMerge(
          "min-w-0 flex-1 text-[11px] font-semibold tracking-wide",
          variant === "error" ? "text-rose-200/95" : "text-zinc-200/95",
        )}
      >
        {title}
      </span>
      {headerTrailing != null ? (
        <span className="flex shrink-0 items-center gap-1.5">{headerTrailing}</span>
      ) : null}
      {collapsible ? (
        <ChevronDown
          className={twMerge(
            "h-3.5 w-3.5 shrink-0 text-zinc-500 transition-transform",
            isOpen ? "rotate-0" : "-rotate-90",
          )}
          aria-hidden
        />
      ) : null}
    </>
  );

  const headerRow = collapsible ? (
    <button
      type="button"
      className="flex w-full min-w-0 cursor-pointer items-center gap-2 py-1.5 text-left hover:text-zinc-100"
      aria-expanded={isOpen}
      onClick={() => setOpen(!isOpen)}
    >
      {headerInner}
    </button>
  ) : (
    <div className="flex w-full min-w-0 items-center gap-2 py-1.5">{headerInner}</div>
  );

  return (
    <section
      className={twMerge(
        "min-w-0 rounded-md border border-zinc-800/80 bg-zinc-950/30",
        variant === "error" ? "border-rose-900/40 bg-rose-950/15" : null,
        className,
      )}
    >
      <div
        className={twMerge(
          "border-b px-2.5",
          isOpen ? "border-zinc-800/70" : "border-transparent",
          variant === "error" && isOpen ? "border-rose-900/35" : null,
        )}
      >
        {headerRow}
        {hint != null && hint.length > 0 && isOpen ? (
          <p className="pb-1.5 text-[10px] leading-snug text-zinc-500">{hint}</p>
        ) : null}
      </div>
      {isOpen ? <div className={contentClassName}>{children}</div> : null}
    </section>
  );
}
