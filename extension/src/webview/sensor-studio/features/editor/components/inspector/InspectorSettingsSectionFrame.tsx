import type { ReactNode } from "react";
import { InspectorScopeThisNodeChip } from "./InspectorScopeChip";
import { InspectorSection } from "./InspectorSection";

export type InspectorSettingsSectionFrameProps = {
  title: string;
  children: ReactNode;
  /** Extra classes on the outer chrome (border panel). */
  className?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  /**
   * When true, the frame becomes a column flex child that fills remaining height (`flex-1 min-h-0`),
   * with scrollable content delegated to descendants. Use for tall inspector sections (e.g. clip lists).
   */
  fillAvailableHeight?: boolean;
};

/** Shared bordered card for typed inspector sections with form fields. */
export function InspectorSettingsSectionFrame(props: InspectorSettingsSectionFrameProps) {
  const {
    title,
    children,
    className = "",
    collapsible = true,
    defaultExpanded = true,
    fillAvailableHeight = false,
  } = props;

  const contentClassName = fillAvailableHeight
    ? "flex min-h-0 flex-1 flex-col gap-2 overflow-hidden border-t border-zinc-800/60 pt-2"
    : "min-h-0 space-y-3 border-t border-zinc-800/60 px-2 py-1.5 pt-2";

  return (
    <InspectorSection
      title={title}
      variant="compact"
      collapsible={collapsible}
      defaultExpanded={defaultExpanded}
      className={
        fillAvailableHeight
          ? `flex min-h-0 flex-1 flex-col ${className}`
          : className
      }
      contentClassName={contentClassName}
      headerTrailing={<InspectorScopeThisNodeChip />}
    >
      {fillAvailableHeight ? children : <div className="space-y-3">{children}</div>}
    </InspectorSection>
  );
}
