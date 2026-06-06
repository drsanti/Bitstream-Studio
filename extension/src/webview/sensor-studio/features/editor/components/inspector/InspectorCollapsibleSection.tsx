import type { ReactNode } from "react";
import {
  inferInspectorScopeBadge,
  type InspectorScopeBadgeLabel,
} from "./inspector-section-scope-badges";
import { InspectorSectionScopeBadge } from "./InspectorScopeChip";
import { InspectorSection } from "./InspectorSection";

export type InspectorCollapsibleSectionProps = {
  title: string;
  icon?: ReactNode;
  /** Title hover tooltip when the section has form fields. */
  iconHint?: string;
  /** Optional pill beside the title (e.g. port type badge). */
  badge?: ReactNode;
  defaultExpanded?: boolean;
  children?: ReactNode;
  className?: string;
  /**
   * Meaningful scope label for this card (Config, Layout, Pins, …).
   * When omitted, inferred from `title` when a known mapping exists.
   * Pass `null` to hide the scope badge.
   */
  scopeBadge?: InspectorScopeBadgeLabel | string | null;
};

function hasRenderableChildren(children: ReactNode): boolean {
  if (children == null || children === false) {
    return false;
  }
  if (Array.isArray(children)) {
    return children.some((child) => child != null && child !== false);
  }
  return true;
}

/**
 * Typed node settings card — same chrome as layout cards ({@link InspectorSection} compact).
 */
export function InspectorCollapsibleSection(props: InspectorCollapsibleSectionProps) {
  const {
    title,
    icon,
    iconHint,
    badge,
    defaultExpanded = true,
    children,
    className = "",
    scopeBadge: scopeBadgeProp,
  } = props;

  const hasBody = hasRenderableChildren(children);

  if (!hasBody) {
    return null;
  }

  const hint = iconHint != null && iconHint.length > 0 ? iconHint : undefined;

  const scopeBadge =
    scopeBadgeProp === null
      ? undefined
      : (scopeBadgeProp ?? inferInspectorScopeBadge(title));

  const headerTrailing =
    badge != null || scopeBadge != null ? (
      <span className="inline-flex shrink-0 items-center gap-1.5">
        {badge}
        {scopeBadge != null ? (
          <InspectorSectionScopeBadge label={scopeBadge} />
        ) : null}
      </span>
    ) : undefined;

  return (
    <InspectorSection
      title={title}
      hint={hint}
      titleLeadingSlot={icon}
      headerTrailing={headerTrailing}
      variant="compact"
      defaultExpanded={defaultExpanded}
      className={className}
      contentClassName="space-y-1.5 px-2 py-1.5"
    >
      {children}
    </InspectorSection>
  );
}
