/**
 * GLB Animation Lab — multi-clip investigation preview (solo / parallel).
 * Spec: `GLB_ANIMATION_LAB.md`. Quaternion orientation card stays frozen separately.
 */
import { Clapperboard } from "lucide-react";
import { TRNInteractiveCard } from "@/ui/TRN";
import { GlbAnimationLabViewport } from "./GlbAnimationLabViewport.js";

export type GlbAnimationLabPreviewCardProps = {
  collapsible?: boolean;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
};

export function GlbAnimationLabPreviewCard(props: GlbAnimationLabPreviewCardProps) {
  const { collapsible = true, collapsed, onCollapsedChange } = props;

  return (
    <TRNInteractiveCard
      title="GLB Animation Lab"
      titleLeadingSlot={
        <Clapperboard className="h-4 w-4 text-zinc-400" strokeWidth={2.25} aria-hidden />
      }
      headerTitleClassName="normal-case tracking-normal text-zinc-100"
      className="flex min-h-0 flex-1 flex-col rounded-md border-zinc-700/80 bg-black/40 p-2 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
      collapsible={collapsible}
      collapsed={collapsed}
      onCollapsedChange={onCollapsedChange}
      contentClassName="flex h-full min-h-[280px] flex-1 flex-col"
    >
      <GlbAnimationLabViewport />
    </TRNInteractiveCard>
  );
}
