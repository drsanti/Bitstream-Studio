/**
 * Side-by-side quaternion and fusion-Euler 3D previews (two WebGL contexts). See `docs/ROTATION_3D_PREVIEW.md`.
 */
import { Columns2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { TRNInteractiveCard, TRNSplitPane } from "@/ui/TRN";
import type { Bmi270WireReceiveDiag } from "../../state/bitstreamLive.store.js";
import type { Bmi270LiveSample } from "../../types/bitstreamWorkspaceTypes.js";
import {
  extractFusionEulerHundredthsFromBmi270Sample,
  extractNormalizedQuatFromBmi270Sample,
  hasFusionQuaternionWireFields,
} from "./shared/bmi270FusionExtract.js";
import type { RotationPreviewSceneProps } from "./shared/RotationPreviewScene.js";
import { RotationPreviewViewport } from "./shared/RotationPreviewViewport.js";

export type Rotation3DPreviewSplitProps = {
  sample: Bmi270LiveSample | null;
  wireDiag?: Bmi270WireReceiveDiag | null;
  collapsible?: boolean;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  titleLeadingPrefixSlot?: ReactNode;
};

export function Rotation3DPreviewSplit(props: Rotation3DPreviewSplitProps) {
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

  const { qw, qx, qy, qz } = useMemo(
    () => extractNormalizedQuatFromBmi270Sample(sample),
    [
      sample?.fusionQuatXX10000,
      sample?.fusionQuatYX10000,
      sample?.fusionQuatZX10000,
      sample?.fusionQuatWBucketX10000,
    ],
  );

  const fusionEulerHundredths = useMemo(
    () => extractFusionEulerHundredthsFromBmi270Sample(sample),
    [
      sample?.isBmi270FusionPayload,
      sample?.fusionRollRadX100,
      sample?.fusionPitchRadX100,
      sample?.fusionHeadingRadX100,
    ],
  );

  const eulerHundredthsStable = useMemo(
    () => fusionEulerHundredths ?? { roll: 0, pitch: 0, heading: 0 },
    [fusionEulerHundredths],
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

  const quaternionScene = useMemo((): RotationPreviewSceneProps => {
    return {
      qw,
      qx,
      qy,
      qz,
      fusionEulerHundredths,
      meshOrientationFromEulerFallback,
      showGrid: true,
    };
  }, [fusionEulerHundredths, meshOrientationFromEulerFallback, qw, qx, qy, qz]);

  const eulerScene = useMemo((): RotationPreviewSceneProps => {
    return {
      qw: 1,
      qx: 0,
      qy: 0,
      qz: 0,
      fusionEulerHundredths: eulerHundredthsStable,
      meshOrientationFromEulerFallback: false,
      eulerOnly: true,
      showGrid: true,
    };
  }, [eulerHundredthsStable]);

  const titleLeadingSlot =
    titleLeadingPrefixSlot != null ? (
      <div className="inline-flex items-center gap-1">
        {titleLeadingPrefixSlot}
        <Columns2 className="h-4 w-4 text-zinc-400" strokeWidth={2.25} aria-hidden />
      </div>
    ) : (
      <Columns2 className="h-4 w-4 text-zinc-400" strokeWidth={2.25} aria-hidden />
    );

  const viewportSharedBase = {
    wireDiag,
    uiHzFromCounter,
    workspaceChrome,
  } as const;

  return (
    <TRNInteractiveCard
      title="3D Rotation (Quaternion | Euler)"
      titleLeadingSlot={titleLeadingSlot}
      headerTitleClassName="normal-case tracking-normal text-zinc-100"
      className={
        workspaceChrome
          ? "flex min-h-0 flex-1 flex-col rounded-md border-zinc-700/80 bg-black/40 p-2 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
          : "flex min-h-0 flex-1 rounded-md border-zinc-700/80 bg-black/40 p-2"
      }
      collapsible={collapsible}
      collapsed={collapsed}
      onCollapsedChange={onCollapsedChange}
      collapsibleMeasureIntrinsic={!(workspaceChrome && collapsible)}
      contentClassName="flex min-h-0 flex-1 flex-col"
    >
      <div
        className={
          workspaceChrome
            ? "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
            : "flex min-h-[240px] min-w-0 flex-1 flex-col overflow-hidden"
        }
      >
        <TRNSplitPane
          direction="horizontal"
          defaultSize={0.5}
          persistKey="bitstream-app:rotation-3d-quaternion-euler-split"
          minPrimaryPx={140}
          minSecondaryPx={140}
          className="min-h-0 min-w-0 flex-1"
          primaryClassName="flex min-h-0 min-w-0 flex-col"
          secondaryClassName="flex min-h-0 min-w-0 flex-col"
          primary={
            <RotationPreviewViewport
              {...viewportSharedBase}
              scene={quaternionScene}
              panelBadge="Quaternion"
              telemetryHudStorageKey="bitstream:viewport-hud:quaternion-split"
              quaternionWireOverlay
            />
          }
          secondary={
            <RotationPreviewViewport
              {...viewportSharedBase}
              scene={eulerScene}
              panelBadge="Euler ZYX"
              telemetryHudStorageKey="bitstream:viewport-hud:euler-split"
              eulerWireOverlay
            />
          }
        />
      </div>
    </TRNInteractiveCard>
  );
}
