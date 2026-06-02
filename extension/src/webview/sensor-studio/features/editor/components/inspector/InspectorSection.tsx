import type { ReactNode } from "react";
import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { TRNInteractiveCard } from "../../../../../ui/TRN";

export type InspectorSectionProps = {
  title: string;
  /** Hover tooltip on the section title. */
  hint?: ReactNode;
  /** Optional actions on the section header row (right). */
  headerTrailing?: ReactNode;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  collapsible?: boolean;
  variant?: "default" | "compact" | "error";
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
    collapsible = true,
    variant = "default",
    children,
    className = "",
    contentClassName,
  } = props;

  const resolvedContentClassName =
    contentClassName ??
    (variant === "compact" ? "space-y-1 px-2 py-1.5" : "px-2.5 py-2");

  const [expanded, setExpanded] = useState(defaultExpanded);
  const isOpen = collapsible ? expanded : true;

  const setOpen = (next: boolean) => {
    if (collapsible) {
      setExpanded(next);
      onExpandedChange?.(next);
    }
  };

  return (
    <TRNInteractiveCard
      title={title}
      hint={hint}
      titleTrailingSlot={headerTrailing}
      shell={variant === "error" ? "accent-rose" : "glass"}
      className={className}
      headerTitleClassName={twMerge(
        "font-semibold tracking-wide",
        variant === "compact" ? "text-[10px]" : "text-[11px]",
        variant === "error" ? "text-rose-200/95" : "text-zinc-200/95",
      )}
      contentClassName={twMerge(
        "min-h-0 border-t border-zinc-800/60 pt-2",
        resolvedContentClassName,
      )}
      collapsible={collapsible}
      collapsed={collapsible ? !isOpen : undefined}
      onCollapsedChange={(nextCollapsed) => setOpen(!nextCollapsed)}
      defaultExpanded={defaultExpanded}
    >
      {children}
    </TRNInteractiveCard>
  );
}
