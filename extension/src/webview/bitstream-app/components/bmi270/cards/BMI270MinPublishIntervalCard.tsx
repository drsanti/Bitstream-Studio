import { TimerReset } from "lucide-react";
import { MIN_PUBLISH_HZ_PRESETS } from "../../../../../bitstream2/domains/config/sensor-rate-presets";
import { SensorHzIntervalCard } from "../../shared/SensorHzIntervalCard";
import type { Bmi270AckState } from "../types";
import { SENSOR_CFG_UI } from "../../../constants/sensorConfigUiLabels";
import type { SensorCfgCardApplyProps } from "../../../../sensor-telemetry/components/panels/SensorCfgCardHeaderTrailing.js";

export function BMI270MinPublishIntervalCard(props: {
  collapsed: boolean;
  disabled: boolean;
  ack: Bmi270AckState;
  minPublishIntervalMs: number;
  onToggleCollapsed: () => void;
  onMinPublishIntervalMsChange: (nextValue: number) => void;
  cardApply?: SensorCfgCardApplyProps;
}) {
  const {
    collapsed,
    disabled,
    ack,
    minPublishIntervalMs,
    onToggleCollapsed,
    onMinPublishIntervalMsChange,
    cardApply,
  } = props;
  return (
    <SensorHzIntervalCard
      title={SENSOR_CFG_UI.minPublishInterval}
      icon={TimerReset}
      collapsed={collapsed}
      controlsDisabled={disabled}
      ack={ack}
      intervalMs={minPublishIntervalMs}
      presets={MIN_PUBLISH_HZ_PRESETS}
      onToggleCollapsed={onToggleCollapsed}
      onIntervalMsChange={onMinPublishIntervalMsChange}
      cardApply={cardApply}
      rateField={{
        allowZero: true,
      }}
    />
  );
}
