import { FAST_SENSOR_SAMPLING_HZ_PRESETS } from "../../../../../bitstream2/domains/config/sensor-rate-presets";
import { SensorSamplingFrequencyCard } from "../../shared/SensorSamplingFrequencyCard";
import type { Bmi270AckState, SensorPublishMode } from "../types";
import type { SensorCfgCardApplyProps } from "../../../../sensor-telemetry/components/panels/SensorCfgCardHeaderTrailing.js";

export function BMI270SamplingFrequencyCard(props: {
  collapsed: boolean;
  controlsDisabled?: boolean;
  ack: Bmi270AckState;
  samplingIntervalMs: number;
  publishMode: SensorPublishMode;
  onToggleCollapsed: () => void;
  onSamplingFrequencyChange: (nextMs: number) => void;
  cardApply?: SensorCfgCardApplyProps;
}) {
  return (
    <SensorSamplingFrequencyCard
      {...props}
      presets={FAST_SENSOR_SAMPLING_HZ_PRESETS}
      hint=""
    />
  );
}
