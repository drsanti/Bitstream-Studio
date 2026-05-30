import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";
import { EulerRotation3DPreviewCard } from "../components/3d-rotation/EulerRotation3DPreviewCard.js";
import type { Bmi270WireReceiveDiag } from "../state/bitstreamLive.store.js";
import type { Bmi270LiveSample } from "../types/bitstreamWorkspaceTypes.js";

export type BitstreamRotation3DEulerWorkspaceCardProps = {
  sample: Bmi270LiveSample | null;
  wireDiag?: Bmi270WireReceiveDiag | null;
  collapsible?: boolean;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  titleLeadingPrefixSlot?: ReactNode;
  /** When true and not collapsed, outer wrapper fills the sensor workspace column. */
  workspaceFill?: boolean;
};

/**
 * Sensor workspace **Euler-only** 3D orientation preview (fusion Euler → mesh + Euler wire overlay).
 */
export function BitstreamRotation3DEulerWorkspaceCard(
  props: BitstreamRotation3DEulerWorkspaceCardProps,
) {
  const {
    sample,
    wireDiag,
    collapsible = true,
    collapsed,
    onCollapsedChange,
    titleLeadingPrefixSlot,
    workspaceFill = true,
  } = props;

  const prefix =
    titleLeadingPrefixSlot ?? (
      <span
        className="inline-flex shrink-0 items-center justify-center text-zinc-400"
        aria-hidden
      >
        <GripVertical className="h-5 w-5" strokeWidth={2.25} />
      </span>
    );

  const outerClass =
    workspaceFill && !collapsed
      ? "flex h-full min-h-0 min-w-0 w-full flex-1 flex-col"
      : "min-w-0 w-full";

  return (
    <div className={outerClass}>
      <EulerRotation3DPreviewCard
        sample={sample}
        wireDiag={wireDiag}
        collapsible={collapsible}
        collapsed={collapsed}
        onCollapsedChange={onCollapsedChange}
        titleLeadingPrefixSlot={prefix}
      />
    </div>
  );
}
