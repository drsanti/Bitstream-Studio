/*******************************************************************************
 * File Name : BMI270TelemetryChannelsCard.tsx
 *
 * Description : Custom BMI270 channel checkboxes (non-preset masks only).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.1
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { Radio } from "lucide-react";
import { TRNDragHandle, TRNInteractiveCard } from "@/ui/TRN";
import {
  SensorCfgCardHeaderTrailing,
  type SensorCfgCardApplyProps,
} from "../../../../sensor-telemetry/components/panels/SensorCfgCardHeaderTrailing.js";
import { SENSOR_SOURCE_ID_BMI270 } from "../../../constants/sensorSourceIds.js";
import { SensorMaskChannelsField } from "../../../../bitstream2-simulator/components/SensorMaskChannelsField.js";
import type { Bmi270AckState } from "../types.js";

export function BMI270TelemetryChannelsCard(props: {
  collapsed: boolean;
  controlsDisabled: boolean;
  mask: number;
  appliedMask: number;
  maskDirty: boolean;
  ack?: Bmi270AckState;
  onToggleCollapsed: () => void;
  onMaskChange: (mask: number) => void;
  cardApply?: SensorCfgCardApplyProps;
})
{
  const {
    collapsed,
    controlsDisabled,
    mask,
    appliedMask,
    maskDirty,
    ack,
    onToggleCollapsed,
    onMaskChange,
    cardApply,
  } = props;

  return (
    <TRNInteractiveCard
      title="Custom channels"
      titleLeadingSlot={
        <div className="inline-flex items-center gap-1">
          <TRNDragHandle className="h-5 w-5 border-0 bg-transparent p-0 text-zinc-400 hover:bg-transparent!" />
          <Radio className="h-4 w-4 text-zinc-400" strokeWidth={2.25} aria-hidden />
        </div>
      }
      titleTrailingSlot={
        <SensorCfgCardHeaderTrailing
          dirty={cardApply?.dirty ?? maskDirty}
          applyDisabled={cardApply?.disabled}
          applyTitle={cardApply?.title}
          onApply={cardApply?.onApply}
          ack={ack ?? { state: "idle" }}
        />
      }
      headerTitleClassName="normal-case tracking-normal text-zinc-100"
      shell="solid"
      className="h-auto"
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
      <SensorMaskChannelsField
        sensorId={SENSOR_SOURCE_ID_BMI270}
        mask={mask}
        appliedMask={appliedMask}
        dirty={maskDirty}
        disabled={controlsDisabled}
        showMaskHex={false}
        showAppliedHex={false}
        showPresets={false}
        showHexEditor={false}
        onMaskChange={onMaskChange}
      />
    </TRNInteractiveCard>
  );
}
