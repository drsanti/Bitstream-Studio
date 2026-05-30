/**
 * Quaternion fusion → mesh orientation preview. Companion doc: `docs/ROTATION_3D_PREVIEW.md`.
 */
import { Box } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { TRNInteractiveCard } from "@/ui/TRN";
import type { Bmi270WireReceiveDiag } from "../../state/bitstreamLive.store.js";
import { useBmi270FusionQuatOrientationStore } from "../../state/bmi270FusionQuatOrientation.store.js";
import { useShallow } from "zustand/react/shallow";
import type { Bmi270LiveSample } from "../../types/bitstreamWorkspaceTypes.js";
import {
  extractFusionEulerHundredthsFromBmi270Sample,
  extractNormalizedQuatFromBmi270Sample,
  hasFusionQuaternionWireFields,
} from "./shared/bmi270FusionExtract.js";
import type { RotationPreviewSceneProps } from "./shared/RotationPreviewScene.js";
import { RotationPreviewViewport } from "./shared/RotationPreviewViewport.js";

export {
  extractNormalizedQuatFromBmi270Sample,
  type FusionEulerHundredths,
} from "./shared/bmi270FusionExtract.js";

export type QuaternionRotation3DPreviewCardProps = {
  sample: Bmi270LiveSample | null;
  wireDiag?: Bmi270WireReceiveDiag | null;
  collapsible?: boolean;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  titleLeadingPrefixSlot?: ReactNode;
};

export function QuaternionRotation3DPreviewCard(
  props: QuaternionRotation3DPreviewCardProps,
) {
  const {
    sample,
    wireDiag,
    collapsible = false,
    collapsed,
    onCollapsedChange,
    titleLeadingPrefixSlot,
  } = props;
  const workspaceChrome = Boolean(collapsible || titleLeadingPrefixSlot);
  const [uiHzFromCounter, setUiHzFromCounter] = useState<number | null>(null);
  const lastSampleCounterRef = useRef<number | null>(null);
  const lastSampleAtRef = useRef<number | null>(null);

  useEffect(() => {
    const counter = typeof sample?.counter === "number" ? sample.counter : null;
    if (counter == null) {
      return;
    }
    const now = performance.now();
    if (
      lastSampleCounterRef.current != null &&
      lastSampleAtRef.current != null &&
      counter > lastSampleCounterRef.current
    ) {
      const deltaCounter = counter - lastSampleCounterRef.current;
      const deltaMs = now - lastSampleAtRef.current;
      if (deltaMs > 0) {
        setUiHzFromCounter((deltaCounter * 1000) / deltaMs);
      }
    }
    lastSampleCounterRef.current = counter;
    lastSampleAtRef.current = now;
  }, [sample?.counter]);

  const orientQuat = useBmi270FusionQuatOrientationStore(
    useShallow((s) => ({
      qw: s.qw,
      qx: s.qx,
      qy: s.qy,
      qz: s.qz,
      lastAtMs: s.lastAtMs,
    })),
  );

  /* Live sample decode = firmware wire (no filter). Store is fallback when coalesced UI lags. */
  const { qw, qx, qy, qz } = useMemo(() => {
    if (sample != null && hasFusionQuaternionWireFields(sample)) {
      return extractNormalizedQuatFromBmi270Sample(sample);
    }
    if (orientQuat.lastAtMs != null) {
      return {
        qw: orientQuat.qw,
        qx: orientQuat.qx,
        qy: orientQuat.qy,
        qz: orientQuat.qz,
      };
    }
    return extractNormalizedQuatFromBmi270Sample(sample);
  }, [
    sample,
    sample?.fusionQuatXX10000,
    sample?.fusionQuatYX10000,
    sample?.fusionQuatZX10000,
    sample?.fusionQuatWBucketX10000,
    orientQuat.lastAtMs,
    orientQuat.qw,
    orientQuat.qx,
    orientQuat.qy,
    orientQuat.qz,
  ]);

  const fusionEulerHundredths = useMemo(
    () => extractFusionEulerHundredthsFromBmi270Sample(sample),
    [
      sample?.isBmi270FusionPayload,
      sample?.fusionRollRadX100,
      sample?.fusionPitchRadX100,
      sample?.fusionHeadingRadX100,
    ],
  );

  const meshOrientationFromEulerFallback = useMemo(() => {
    if (sample == null) {
      return false;
    }
    if (sample.isBmi270FusionPayload && hasFusionQuaternionWireFields(sample)) {
      return false;
    }
    return fusionEulerHundredths != null;
  }, [
    sample,
    sample?.fusionQuatXX10000,
    sample?.fusionQuatYX10000,
    sample?.fusionQuatZX10000,
    sample?.fusionQuatWBucketX10000,
    sample?.isBmi270FusionPayload,
    fusionEulerHundredths,
  ]);

  const scene = useMemo((): RotationPreviewSceneProps => ({
      qw,
      qx,
      qy,
      qz,
      fusionEulerHundredths,
      meshOrientationFromEulerFallback,
      showGrid: true,
    }),
    [fusionEulerHundredths, meshOrientationFromEulerFallback, qw, qx, qy, qz],
  );

  const titleLeadingSlot =
    titleLeadingPrefixSlot != null ? (
      <div className="inline-flex items-center gap-1">
        {titleLeadingPrefixSlot}
        <Box className="h-4 w-4 text-zinc-400" strokeWidth={2.25} aria-hidden />
      </div>
    ) : (
      <Box className="h-4 w-4 text-zinc-400" strokeWidth={2.25} aria-hidden />
    );

  return (
    <TRNInteractiveCard
      title="Quaternion · 3D Orientation"
      titleLeadingSlot={titleLeadingSlot}
      headerTitleClassName="normal-case tracking-normal text-zinc-100"
      className={
        workspaceChrome
          ? "flex h-full min-h-0 flex-1 flex-col rounded-md border-zinc-700/80 bg-black/40 p-2 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
          : "flex min-h-0 flex-1 rounded-md border-zinc-700/80 bg-black/40 p-2"
      }
      collapsible={collapsible}
      collapsed={collapsed}
      onCollapsedChange={onCollapsedChange}
      collapsibleMeasureIntrinsic={!(workspaceChrome && collapsible)}
      contentClassName="flex h-full min-h-0 flex-1 flex-col"
    >
      <RotationPreviewViewport
        scene={scene}
        wireDiag={wireDiag}
        uiHzFromCounter={uiHzFromCounter}
        workspaceChrome={workspaceChrome}
        panelBadge="Quaternion"
        telemetryHudStorageKey="bitstream:viewport-hud:quaternion-solo"
        quaternionWireOverlay
      />
    </TRNInteractiveCard>
  );
}
