import { Activity } from "lucide-react";
import {
  TRNDragHandle,
  TRNInteractiveCard,
  TRNParameterSlider,
  TRNPresetGroup,
} from "@/ui/TRN";
import {
  SensorCfgCardHeaderTrailing,
  type SensorCfgCardApplyProps,
} from "../../../../sensor-telemetry/components/panels/SensorCfgCardHeaderTrailing.js";
import type { Dps368DeltaCardProps } from "../types";

import {
  DELTA_THRESHOLD_SLIDER_TITLE,
  formatDeltaThresholdDisplay,
} from "../../../lib/sensorCfgDeltaThresholdDisplay.js";
import { DPS368_DELTA_THRESHOLD_PRESETS_X100 } from "../../../constants/sensorCfgPresets.js";

const deltaPresetsX100 = [...DPS368_DELTA_THRESHOLD_PRESETS_X100];

export function DPS368DeltaThresholdCard(
  props: Dps368DeltaCardProps & { cardApply?: SensorCfgCardApplyProps },
) {
  const {
    collapsed,
    disabled,
    ack,
    deltaX100,
    onToggleCollapsed,
    onDeltaX100Change,
    cardApply,
  } = props;

  return (
    <TRNInteractiveCard
      title="Delta Threshold"
      titleLeadingSlot={<TRNDragHandle className="h-5 w-5 border-0 bg-transparent p-0 text-zinc-400 hover:bg-transparent!" />}
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
      className="h-auto rounded-md border-zinc-700/80 bg-black/30 p-2"
      collapsible
      collapsed={collapsed}
      onCollapsedChange={(nextCollapsed) => {
        if (nextCollapsed !== collapsed) {
          onToggleCollapsed();
        }
      }}
      contentClassName="min-h-0"
    >
      <div className={disabled ? "pointer-events-none opacity-50" : ""}>
        <TRNParameterSlider
          name="Delta Threshold"
          nameTitle={DELTA_THRESHOLD_SLIDER_TITLE}
          value={deltaX100}
          min={0}
          max={50}
          step={1}
          valueFormatter={formatDeltaThresholdDisplay}
          icon={<Activity className="h-4 w-4 text-zinc-400" strokeWidth={2.25} aria-hidden />}
          onChange={onDeltaX100Change}
        />
        <TRNPresetGroup
          title="Delta Threshold (Preset)"
          presets={deltaPresetsX100}
          value={deltaX100}
          presetLabelFormatter={formatDeltaThresholdDisplay}
          onSelect={onDeltaX100Change}
          icon={<Activity className="h-4 w-4 text-zinc-400" strokeWidth={2.25} aria-hidden />}
        />
      </div>
    </TRNInteractiveCard>
  );
}
