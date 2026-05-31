import type { ReactNode } from "react";
import { TRNMenuSectionTitle } from "../../../../../ui/TRN";

export type InspectorSettingsSectionFrameProps = {
  title: string;
  children: ReactNode;
  /** Extra classes on the outer chrome (border panel). */
  className?: string;
  /**
   * When true, the frame becomes a column flex child that fills remaining height (`flex-1 min-h-0`),
   * with scrollable content delegated to descendants. Use for tall inspector sections (e.g. clip lists).
   */
  fillAvailableHeight?: boolean;
};

/** Shared bordered “card” chrome for typed inspector sections. */
export function InspectorSettingsSectionFrame(props: InspectorSettingsSectionFrameProps) {
  const { title, children, className = "", fillAvailableHeight = false } = props;
  if (fillAvailableHeight) {
    return (
      <div
        className={
          "flex min-h-0 flex-1 flex-col gap-2 overflow-hidden rounded border border-zinc-700/80 bg-zinc-900/40 p-2 " +
          className
        }
      >
        <TRNMenuSectionTitle spacing="labelOnly" className="shrink-0 text-[11px]">
          {title}
        </TRNMenuSectionTitle>
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">{children}</div>
      </div>
    );
  }
  return (
    <div
      className={
        "space-y-3 rounded border border-zinc-700/80 bg-zinc-900/40 p-2.5 " + className
      }
    >
      <TRNMenuSectionTitle spacing="labelOnly" className="text-[11px]">
        {title}
      </TRNMenuSectionTitle>
      {children}
    </div>
  );
}
