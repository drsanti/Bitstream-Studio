/*******************************************************************************
 * File Name : BMI270OutputProfileCard.tsx
 *
 * Description : BMI270 telemetry source presets — Raw / Fusion / All.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.3
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { LayoutTemplate } from "lucide-react";
import { TRNButton, TRNDragHandle, TRNInteractiveCard } from "@/ui/TRN";
import {
  SensorCfgCardHeaderTrailing,
  type SensorCfgCardApplyProps,
} from "../../../../sensor-telemetry/components/panels/SensorCfgCardHeaderTrailing.js";
import {
  BMI270_OUTPUT_PRESETS,
  type Bmi270OutputPresetId,
} from "../../../lib/bmi270OutputProfiles.js";
import type { Bmi270AckState } from "../types.js";
import { SENSOR_CFG_UI } from "../../../constants/sensorConfigUiLabels.js";

export function BMI270OutputProfileCard(props: {
  collapsed: boolean;
  controlsDisabled: boolean;
  /** Firmware-aware preset highlight (from {@link resolveBmi270OutputPresetDisplayState}). */
  activePresetId: Bmi270OutputPresetId | null;
  ack: Bmi270AckState;
  onToggleCollapsed: () => void;
  onPresetSelect: (presetId: Bmi270OutputPresetId) => void;
  cardApply?: SensorCfgCardApplyProps;
})
{
  const {
    collapsed,
    controlsDisabled,
    activePresetId,
    ack,
    onToggleCollapsed,
    onPresetSelect,
    cardApply,
  } = props;

  return (
    <TRNInteractiveCard
      title={SENSOR_CFG_UI.telemetrySources}
      titleLeadingSlot={
        <div className="inline-flex items-center gap-1">
          <TRNDragHandle className="h-5 w-5 border-0 bg-transparent p-0 text-zinc-400 hover:bg-transparent!" />
          <LayoutTemplate className="h-4 w-4 text-zinc-400" strokeWidth={2.25} aria-hidden />
        </div>
      }
      titleTrailingSlot={
        <SensorCfgCardHeaderTrailing
          dirty={cardApply?.dirty ?? false}
          applyDisabled={cardApply?.disabled}
          applyTitle={cardApply?.title}
          onApply={cardApply?.onApply}
          ack={ack}
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
      <div
        className={`${controlsDisabled ? "opacity-50" : ""} rounded border border-zinc-700/80 bg-transparent px-2 pt-1 pb-2 text-sm`}
      >
        <div
          role="radiogroup"
          aria-label="BMI270 telemetry sources"
          className="flex w-full flex-row flex-wrap justify-between gap-2"
        >
          {BMI270_OUTPUT_PRESETS.map((preset) => (
            <TRNButton
              key={preset.id}
              className="min-w-14 flex-1 border-zinc-700/80"
              size="compact"
              selected={activePresetId === preset.id}
              disabled={controlsDisabled}
              hint={preset.hint}
              onClick={() => onPresetSelect(preset.id)}
            >
              {preset.label}
            </TRNButton>
          ))}
        </div>
      </div>
    </TRNInteractiveCard>
  );
}
