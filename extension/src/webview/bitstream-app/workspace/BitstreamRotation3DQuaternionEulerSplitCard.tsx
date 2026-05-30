import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";
import { Rotation3DPreviewSplit } from "../components/3d-rotation/Rotation3DPreviewSplit.js";
import type { Bmi270WireReceiveDiag } from "../state/bitstreamLive.store.js";
import type { Bmi270LiveSample } from "../types/bitstreamWorkspaceTypes.js";

export type BitstreamRotation3DQuaternionEulerSplitCardProps = {
  sample: Bmi270LiveSample | null;
  wireDiag?: Bmi270WireReceiveDiag | null;
  collapsible?: boolean;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /**
   * Optional leading control (e.g. sortable drag handle). Defaults to a grip icon
   * matching the sensor workspace chrome.
   */
  titleLeadingPrefixSlot?: ReactNode;
  /**
   * When true (default), outer layout grows with the center column; when the card
   * is `collapsed`, the wrapper does not take flex-1 height.
   */
  workspaceFill?: boolean;
};

/**
 * Saved workspace layout for **quaternion + Euler ZYX** side-by-side 3D previews
 * (`Rotation3DPreviewSplit`). Use when you need both viewports; the main sensor
 * workspace defaults to {@link BitstreamRotation3DEulerWorkspaceCard} (Euler-only).
 */
export function BitstreamRotation3DQuaternionEulerSplitCard(
  props: BitstreamRotation3DQuaternionEulerSplitCardProps,
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
      ? "flex min-h-0 min-w-0 w-full flex-1 flex-col"
      : "min-w-0 w-full";

  return (
    <div className={outerClass}>
      <Rotation3DPreviewSplit
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
