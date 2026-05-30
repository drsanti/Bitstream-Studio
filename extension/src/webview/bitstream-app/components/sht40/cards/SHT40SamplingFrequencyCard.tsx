import { SLOW_SENSOR_SAMPLING_HZ_PRESETS } from "../../../../../bitstream2/domains/config/sensor-rate-presets";
import { SensorSamplingFrequencyCard } from "../../shared/SensorSamplingFrequencyCard";
import type { Sht40AckState } from "../types";
import type { SensorCfgCardApplyProps } from "../../../../sensor-telemetry/components/panels/SensorCfgCardHeaderTrailing.js";

export function SHT40SamplingFrequencyCard(props: {
  collapsed: boolean;
  controlsDisabled?: boolean;
  ack: Sht40AckState;
  samplingIntervalMs: number;
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
