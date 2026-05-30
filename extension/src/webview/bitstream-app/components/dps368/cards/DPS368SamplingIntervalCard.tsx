import { Gauge } from "lucide-react";
import { SLOW_SENSOR_SAMPLING_HZ_PRESETS } from "../../../../../bitstream2/domains/config/sensor-rate-presets";
import { SensorHzIntervalCard } from "../../shared/SensorHzIntervalCard";
import type { Dps368SamplingCardProps } from "../types";
import { SENSOR_CFG_UI } from "../../../constants/sensorConfigUiLabels";

export function DPS368SamplingIntervalCard(props: Dps368SamplingCardProps) {
  const {
    collapsed,
    controlsDisabled,
    ack,
    dataRateMs,
    onToggleCollapsed,
    onSamplingIntervalChange,
  } = props;

  return (
    <SensorHzIntervalCard
      title={SENSOR_CFG_UI.sampleRate}
      icon={Gauge}
      collapsed={collapsed}
      controlsDisabled={controlsDisabled}
      ack={ack}
      intervalMs={dataRateMs}
      presets={SLOW_SENSOR_SAMPLING_HZ_PRESETS}
      onToggleCollapsed={onToggleCollapsed}
      onIntervalMsChange={onSamplingIntervalChange}
    />
  );
}
