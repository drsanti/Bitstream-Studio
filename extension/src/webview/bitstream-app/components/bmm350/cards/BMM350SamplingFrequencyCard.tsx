import { FAST_SENSOR_SAMPLING_HZ_PRESETS } from "../../../../../bitstream2/domains/config/sensor-rate-presets";
import { SensorSamplingFrequencyCard } from "../../shared/SensorSamplingFrequencyCard";
import type { Bmm350AckState } from "../types";
import type { SensorCfgCardApplyProps } from "../../../../sensor-telemetry/components/panels/SensorCfgCardHeaderTrailing.js";

export function BMM350SamplingFrequencyCard(props: {
  collapsed: boolean;
  controlsDisabled?: boolean;
  ack: Bmm350AckState;
  samplingIntervalMs: number;
  onToggleCollapsed: () => void;
  onSamplingFrequencyChange: (nextMs: number) => void;
  cardApply?: SensorCfgCardApplyProps;
}) {
  return (
    <SensorSamplingFrequencyCard
      {...props}
      presets={FAST_SENSOR_SAMPLING_HZ_PRESETS}
      suppressHint
    />
  );
}
