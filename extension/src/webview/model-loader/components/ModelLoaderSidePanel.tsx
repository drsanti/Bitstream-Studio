import React from "react";
import { CollapsiblePanelCard } from "../../model-catalog/components/CollapsiblePanelCard";

export interface ModelLoaderSidePanelProps {
  title: string;
  side: "left" | "right";
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  headerLeading?: React.ReactNode;
  headerTrailing?: React.ReactNode;
}

export function ModelLoaderSidePanel({
  title,
  side,
  open,
  onToggle,
  children,
  headerLeading,
  headerTrailing,
}: ModelLoaderSidePanelProps) {
  return (
    <CollapsiblePanelCard
      title={title}
      side={side}
      open={open}
      onToggle={onToggle}
      headerLeading={headerLeading}
      headerTrailing={headerTrailing}
    >
      <div className="space-y-3">{children}</div>
    </CollapsiblePanelCard>
  );
}
