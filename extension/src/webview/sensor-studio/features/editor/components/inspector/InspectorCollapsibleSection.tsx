import type { ReactNode } from "react";
import { TRNCard, TRNHintTooltip } from "../../../../../ui/TRN";

export type InspectorCollapsibleSectionProps = {
  title: string;
  icon?: ReactNode;
  /** Shown in a hover tooltip on the header icon ({@link TRNHintTooltip}). */
  iconHint?: string;
  /** Optional pill beside the title (e.g. port type badge). */
  badge?: ReactNode;
  defaultExpanded?: boolean;
  children: ReactNode;
  className?: string;
};

/**
 * Collapsible glass section for Node Inspector typed settings.
 * Matches Model Preview debug cards ({@link TRNCard} soft glass + header hint tooltips).
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
  } = props;

  const headerIcon =
    icon != null && iconHint != null && iconHint.length > 0 ? (
      <TRNHintTooltip
        trigger={icon}
        content={iconHint}
        triggerAriaLabel={`About ${title}`}
        placement="top-start"
      />
    ) : (
      icon
    );

  return (
    <TRNCard
      className={"shrink-0 " + className}
      title={title}
      icon={headerIcon}
      titleTrailing={badge}
      defaultExpanded={defaultExpanded}
      collapsible
      glass
      glassPreset="soft"
      contentClassName="space-y-1.5"
    >
      {children}
    </TRNCard>
  );
}
