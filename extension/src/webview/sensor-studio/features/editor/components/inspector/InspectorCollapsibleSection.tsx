import type { ReactNode } from "react";
import { InspectorScopeThisNodeChip } from "./InspectorScopeChip";
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
  /** When false, omit the “This node” scope chip (default true). */
  showScopeChip?: boolean;
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
    showScopeChip = true,
  } = props;

  const hasBody = hasRenderableChildren(children);

  if (!hasBody) {
    return null;
  }

  const hint = iconHint != null && iconHint.length > 0 ? iconHint : undefined;

  const headerTrailing =
    badge != null || showScopeChip ? (
      <span className="inline-flex shrink-0 items-center gap-1.5">
        {badge}
        {showScopeChip ? <InspectorScopeThisNodeChip /> : null}
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
