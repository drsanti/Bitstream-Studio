/**
 * Fusion Euler (wire ×100 rad → ZYX) → mesh orientation via the same firmware mapping as quaternion preview.
 */
import { Box } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { TRNInteractiveCard } from "@/ui/TRN";
import type { Bmi270WireReceiveDiag } from "../../state/bitstreamLive.store.js";
import type { Bmi270LiveSample } from "../../types/bitstreamWorkspaceTypes.js";
import { extractFusionEulerHundredthsFromBmi270Sample } from "./shared/bmi270FusionExtract.js";
import type { RotationPreviewSceneProps } from "./shared/RotationPreviewScene.js";
import { RotationPreviewViewport } from "./shared/RotationPreviewViewport.js";

export type EulerRotation3DPreviewCardProps = {
  sample: Bmi270LiveSample | null;
  wireDiag?: Bmi270WireReceiveDiag | null;
  collapsible?: boolean;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  titleLeadingPrefixSlot?: ReactNode;
};

export function EulerRotation3DPreviewCard(props: EulerRotation3DPreviewCardProps) {
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

  const fusionEulerHundredths = useMemo(
    () => extractFusionEulerHundredthsFromBmi270Sample(sample),
    [
      sample?.isBmi270FusionPayload,
      sample?.fusionRollRadX100,
      sample?.fusionPitchRadX100,
      sample?.fusionHeadingRadX100,
    ],
  );

  const hundredths = useMemo(
    () => fusionEulerHundredths ?? { roll: 0, pitch: 0, heading: 0 },
    [fusionEulerHundredths],
  );

  const scene = useMemo((): RotationPreviewSceneProps => {
    return {
      qw: 1,
      qx: 0,
      qy: 0,
      qz: 0,
      fusionEulerHundredths: hundredths,
      meshOrientationFromEulerFallback: false,
      eulerOnly: true,
      showGrid: true,
    };
  }, [hundredths]);

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
      title="Euler · 3D Orientation"
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
        panelBadge="Euler"
        telemetryHudStorageKey="bitstream:viewport-hud:euler-solo"
        eulerWireOverlay
      />
    </TRNInteractiveCard>
  );
}
