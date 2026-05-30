/*******************************************************************************
 * File Name : BMI270TelemetryChannelsCard.tsx
 *
 * Description : SENSOR_CFG channel mask (Accel/Gyro/Temp/Euler/Quat) for BMI270 EVT.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { Radio } from "lucide-react";
import { TRNDragHandle, TRNHintText, TRNInteractiveCard } from "@/ui/TRN";
import { SENSOR_SOURCE_ID_BMI270 } from "../../../constants/sensorSourceIds.js";
import { bmi270MaskIncludesFusionChannels } from "../../../lib/bmi270MaskForOutputMode.js";
import type { Bmi270StreamModeUi } from "../../../state/bitstreamConfig.store.js";
import { describeBmi270EvtMask } from "../../../state/bitstreamLive.store.js";
import { SensorMaskChannelsField } from "../../../../bitstream2-simulator/components/SensorMaskChannelsField.js";

export function BMI270TelemetryChannelsCard(props: {
  collapsed: boolean;
  controlsDisabled: boolean;
  mask: number;
  appliedMask: number;
  maskDirty: boolean;
  streamMode: Bmi270StreamModeUi;
  lastEvtMask: number | null;
  onToggleCollapsed: () => void;
  onMaskChange: (mask: number) => void;
})
{
  const {
    collapsed,
    controlsDisabled,
    mask,
    appliedMask,
    maskDirty,
    streamMode,
    lastEvtMask,
    onToggleCollapsed,
    onMaskChange,
  } = props;

  const expectsFusion = streamMode === "fusion" || streamMode === "hybrid";
  const fusionChannelsOk = bmi270MaskIncludesFusionChannels(mask);

  return (
    <TRNInteractiveCard
      title="Telemetry channels"
      titleLeadingSlot={
        <div className="inline-flex items-center gap-1">
          <TRNDragHandle className="h-5 w-5 border-0 bg-transparent p-0 text-zinc-400 hover:bg-transparent!" />
          <Radio className="h-4 w-4 text-zinc-400" strokeWidth={2.25} aria-hidden />
        </div>
      }
      headerTitleClassName="normal-case tracking-normal text-zinc-100"
      className="h-auto rounded-md border-zinc-700/80 bg-black/40 p-2"
      collapsible
      collapsed={collapsed}
      onCollapsedChange={(nextCollapsed) => {
        if (nextCollapsed !== collapsed)
        {
          onToggleCollapsed();
        }
      }}
      contentClassName="min-h-0"
    >
      <p className="mb-2 text-[10px] leading-relaxed text-zinc-400">
        SENSOR_CFG mask — which scalars may appear in EVT_SENSOR. Fusion stream mode also needs Euler +
        Quaternion bits; Apply sends mask with SENSOR_CFG.
      </p>

      <SensorMaskChannelsField
        sensorId={SENSOR_SOURCE_ID_BMI270}
        mask={mask}
        appliedMask={appliedMask}
        dirty={maskDirty}
        disabled={controlsDisabled}
        onMaskChange={onMaskChange}
      />

      {expectsFusion && !fusionChannelsOk ? (
        <TRNHintText tone="warn" className="mt-2 text-[10px] leading-relaxed">
          Stream mode is {streamMode} but Euler and/or Quaternion are off in SENSOR_CFG. Enable them
          (preset All) and click Apply — otherwise EVT stays raw IMU only (e.g. mask 0x03).
        </TRNHintText>
      ) : null}

      <TRNHintText tone="info" className="mt-2 text-[10px] leading-relaxed">
        Last EVT on wire: {describeBmi270EvtMask(lastEvtMask)}
      </TRNHintText>
    </TRNInteractiveCard>
  );
}
