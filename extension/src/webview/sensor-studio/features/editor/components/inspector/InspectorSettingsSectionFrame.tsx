import type { ReactNode } from "react";
import {
  inferInspectorScopeBadge,
  type InspectorScopeBadgeLabel,
} from "./inspector-section-scope-badges";
import { InspectorSectionScopeBadge } from "./InspectorScopeChip";
import { InspectorSection } from "./InspectorSection";

export type InspectorSettingsSectionFrameProps = {
  title: string;
  children: ReactNode;
  /** Hover tooltip on the section title. */
  hint?: ReactNode;
  /** Icon before the section title (Lucide, h-3.5 w-3.5, muted). */
  titleLeadingSlot?: ReactNode;
  /** Meaningful scope label; inferred from `title` when omitted. Pass `null` to hide. */
  scopeBadge?: InspectorScopeBadgeLabel | string | null;
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
    hint,
    titleLeadingSlot,
    scopeBadge: scopeBadgeProp,
    className = "",
    collapsible = true,
    defaultExpanded = true,
    fillAvailableHeight = false,
  } = props;

  const scopeBadge =
    scopeBadgeProp === null
      ? undefined
      : (scopeBadgeProp ?? inferInspectorScopeBadge(title));

  const contentClassName = fillAvailableHeight
    ? "flex min-h-0 flex-1 flex-col gap-2 overflow-hidden border-t border-zinc-800/60 pt-2"
    : "min-h-0 space-y-3 border-t border-zinc-800/60 px-2 py-1.5 pt-2";

  return (
    <InspectorSection
      title={title}
      hint={hint}
      titleLeadingSlot={titleLeadingSlot}
      variant="compact"
      collapsible={collapsible}
      defaultExpanded={defaultExpanded}
      className={
        fillAvailableHeight
          ? `flex min-h-0 flex-1 flex-col ${className}`
          : className
      }
      contentClassName={contentClassName}
      headerTrailing={
        scopeBadge != null ? (
          <InspectorSectionScopeBadge label={scopeBadge} />
        ) : undefined
      }
    >
      {fillAvailableHeight ? children : <div className="space-y-3">{children}</div>}
    </InspectorSection>
  );
}
