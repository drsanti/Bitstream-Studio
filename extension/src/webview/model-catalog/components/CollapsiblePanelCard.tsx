import React from "react";
import { TRNSidePanel } from "../../ui/TRN/index.js";

export interface CollapsiblePanelCardProps {
  title: string;
  open: boolean;
  onToggle: () => void;
  side: "left" | "right";
  children: React.ReactNode;
  className?: string;
  headerLeading?: React.ReactNode;
  headerTrailing?: React.ReactNode;
  bodyClassName?: string;
}

/**
 * Legacy API wrapper around {@link TRNSidePanel} for Model Loader and similar overlays.
 * Prefer {@link TRNSidePanel} directly when you control layout (e.g. Model Preview modal).
 */
export function CollapsiblePanelCard({
  title,
  open,
  onToggle,
  side,
  children,
  className,
  headerLeading,
  headerTrailing,
  bodyClassName,
}: CollapsiblePanelCardProps) {
  const titleNode =
    headerLeading != null ? (
      <span className="flex min-w-0 items-center gap-2">
        <span className="shrink-0">{headerLeading}</span>
        <span className="truncate">{title}</span>
      </span>
    ) : (
      title
    );

  return (
    <div className={`relative h-full min-h-0 w-full ${className ?? ""}`}>
      <TRNSidePanel
        side={side}
        mode="overlay"
        variant={side === "left" ? "settings" : "inspector"}
        title={titleNode}
        actions={headerTrailing}
        backdrop="none"
        glass
        defaultWidth={side === "left" ? 340 : 360}
        minWidth={side === "left" ? 260 : 280}
        maxWidth={side === "left" ? 520 : 560}
        collapsible
        resizable
        collapsedPresentation="floating-only"
        collapsed={!open}
        onCollapsedChange={(nextCollapsed) => {
          const nextOpen = !nextCollapsed;
          if (nextOpen !== open) {
            onToggle();
          }
        }}
        contentClassName={bodyClassName ?? "p-3 scrollbar-hide"}
        className="pointer-events-auto h-full"
        overlayOffset={{
          top: 0,
          bottom: 0,
          ...(side === "left" ? { left: 0 } : { right: 0 }),
        }}
      >
        {children}
      </TRNSidePanel>
    </div>
  );
}
