/*******************************************************************************
 * File Name : BitstreamRotation3DFusionWorkspaceCard.tsx
 *
 * Description : Sensor workspace 3D orientation — quaternion when wire has QUAT,
 *               otherwise fusion Euler (matches ROTATION_3D_PREVIEW.md).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";
import { EulerRotation3DPreviewCard } from "../components/3d-rotation/EulerRotation3DPreviewCard.js";
import { QuaternionRotation3DPreviewCard } from "../components/3d-rotation/QuaternionRotation3DPreviewCard.js";
import { hasFusionQuaternionWireFields } from "../components/3d-rotation/shared/bmi270FusionExtract.js";
import type { Bmi270WireReceiveDiag } from "../state/bitstreamLive.store.js";
import type { Bmi270LiveSample } from "../types/bitstreamWorkspaceTypes.js";

export type BitstreamRotation3DFusionWorkspaceCardProps = {
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
 * Focal 3D preview: prefer fusion **quaternion** on the wire (same source as the quaternion deck);
 * fall back to Euler when QUAT scalars are absent.
 */
export function BitstreamRotation3DFusionWorkspaceCard(
  props: BitstreamRotation3DFusionWorkspaceCardProps,
)
{
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

  const useQuaternion =
    sample != null && hasFusionQuaternionWireFields(sample);

  return (
    <div className={outerClass}>
      {useQuaternion ? (
        <QuaternionRotation3DPreviewCard
          sample={sample}
          wireDiag={wireDiag}
          collapsible={collapsible}
          collapsed={collapsed}
          onCollapsedChange={onCollapsedChange}
          titleLeadingPrefixSlot={prefix}
        />
      ) : (
        <EulerRotation3DPreviewCard
          sample={sample}
          wireDiag={wireDiag}
          collapsible={collapsible}
          collapsed={collapsed}
          onCollapsedChange={onCollapsedChange}
          titleLeadingPrefixSlot={prefix}
        />
      )}
    </div>
  );
}
