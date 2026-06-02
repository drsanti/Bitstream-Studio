import type { ReactNode } from "react";
import { TRNInteractiveCard } from "../../../../../ui/TRN";

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

/** Shared bordered “card” chrome for typed inspector sections. */
export function InspectorSettingsSectionFrame(props: InspectorSettingsSectionFrameProps) {
  const {
    title,
    children,
    className = "",
    collapsible = true,
    defaultExpanded = true,
    fillAvailableHeight = false,
  } = props;
  if (fillAvailableHeight) {
    return (
      <TRNInteractiveCard
        title={title}
        shell="glass"
        className={"flex min-h-0 flex-1 flex-col " + className}
        headerTitleClassName="text-[11px] font-semibold text-zinc-200/95"
        contentClassName="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden border-t border-zinc-800/60 pt-2"
        collapsible={collapsible}
        defaultExpanded={defaultExpanded}
      >
        {children}
      </TRNInteractiveCard>
    );
  }
  return (
    <TRNInteractiveCard
      title={title}
      shell="glass"
      className={className}
      headerTitleClassName="text-[11px] font-semibold text-zinc-200/95"
      contentClassName="min-h-0 border-t border-zinc-800/60 pt-2"
      collapsible={collapsible}
      defaultExpanded={defaultExpanded}
    >
      <div className="space-y-3">{children}</div>
    </TRNInteractiveCard>
  );
}
