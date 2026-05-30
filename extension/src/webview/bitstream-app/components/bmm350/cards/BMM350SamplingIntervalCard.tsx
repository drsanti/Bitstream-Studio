import { Gauge } from "lucide-react";
import { FAST_SENSOR_SAMPLING_HZ_PRESETS } from "../../../../../bitstream2/domains/config/sensor-rate-presets";
import { SensorHzIntervalCard } from "../../shared/SensorHzIntervalCard";
import type { Bmm350AckState } from "../types";
import { SENSOR_CFG_UI } from "../../../constants/sensorConfigUiLabels";

export function BMM350SamplingIntervalCard(props: {
  collapsed: boolean;
  controlsDisabled: boolean;
  ack: Bmm350AckState;
  dataRateMs: number;
  onToggleCollapsed: () => void;
  onSamplingIntervalChange: (nextValue: number) => void;
}) {
  const { collapsed, controlsDisabled, ack, dataRateMs, onToggleCollapsed, onSamplingIntervalChange } =
    props;
  return (
    <SensorHzIntervalCard
      title={SENSOR_CFG_UI.sampleRate}
      icon={Gauge}
      collapsed={collapsed}
      controlsDisabled={controlsDisabled}
      ack={ack}
      intervalMs={dataRateMs}
      presets={FAST_SENSOR_SAMPLING_HZ_PRESETS}
      onToggleCollapsed={onToggleCollapsed}
      onIntervalMsChange={onSamplingIntervalChange}
    />
  );
}
