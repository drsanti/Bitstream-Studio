import type { ReactNode } from "react";
import { TRNInteractiveCard } from "../../ui/TRN";

export const COURSE_INSPECTOR_CARD_ICON_CLASS = "h-3.5 w-3.5 shrink-0 text-zinc-400";

export type CourseInspectorCardProps = {
  id?: string;
  title: string;
  hint?: string;
  /** Meaningful Lucide icon before the title (`trn-ui-consistency.mdc`). */
  titleIcon?: ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (next: boolean) => void;
  children: ReactNode;
};

/** Glass card chrome for Course Studio inspector panels (Sensor Studio CanvasInspectorCard parity). */
export function CourseInspectorCard(props: CourseInspectorCardProps) {
  const {
    id,
    title,
    hint,
    titleIcon,
    collapsible,
    defaultExpanded,
    collapsed,
    defaultCollapsed,
    onCollapsedChange,
    children,
  } = props;

  return (
    <TRNInteractiveCard
      title={title}
      hint={hint}
      titleLeadingSlot={titleIcon}
      shell="glass"
      className="h-auto"
      headerTitleClassName="text-[11px] font-semibold text-zinc-200/95"
      contentClassName="min-h-0"
      collapsible={collapsible ?? true}
      defaultExpanded={defaultExpanded}
      collapsed={collapsed}
      defaultCollapsed={defaultCollapsed}
      onCollapsedChange={onCollapsedChange}
      {...(id != null ? { id } : null)}
    >
      {children}
    </TRNInteractiveCard>
  );
}
