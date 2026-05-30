import { SLOW_SENSOR_SAMPLING_HZ_PRESETS } from "../../../../../bitstream2/domains/config/sensor-rate-presets";
import { SensorSamplingFrequencyCard } from "../../shared/SensorSamplingFrequencyCard";
import type { Dps368AckState, SensorPublishMode } from "../types";
import type { SensorCfgCardApplyProps } from "../../../../sensor-telemetry/components/panels/SensorCfgCardHeaderTrailing.js";

export function DPS368SamplingFrequencyCard(props: {
  collapsed: boolean;
  controlsDisabled?: boolean;
  ack: Dps368AckState;
  samplingIntervalMs: number;
  publishMode: SensorPublishMode;
  onToggleCollapsed: () => void;
  onSamplingFrequencyChange: (nextMs: number) => void;
  cardApply?: SensorCfgCardApplyProps;
}) {
  return (
    <SensorSamplingFrequencyCard
      {...props}
      presets={SLOW_SENSOR_SAMPLING_HZ_PRESETS}
      suppressHint
    />
  );
}
