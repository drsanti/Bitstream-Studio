import type { ReactNode } from "react";
import { TRNInteractiveCard } from "../../../../../ui/TRN";

export type CanvasInspectorCardProps = {
  id?: string;
  title: string;
  hint?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (next: boolean) => void;
  children: ReactNode;
};

/** Glass {@link TRNInteractiveCard} chrome for canvas inspector tabs (View / Flow / Sensors). */
export function CanvasInspectorCard(props: CanvasInspectorCardProps) {
  const {
    id,
    title,
    hint,
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
      shell="glass"
      className="h-auto"
      headerTitleClassName="text-[11px] font-semibold text-zinc-200/95"
      contentClassName="min-h-0"
      collapsible={collapsible}
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
