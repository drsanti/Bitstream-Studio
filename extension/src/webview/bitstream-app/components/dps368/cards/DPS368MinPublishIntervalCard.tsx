import { TimerReset } from "lucide-react";
import { MIN_PUBLISH_HZ_PRESETS } from "../../../../../bitstream2/domains/config/sensor-rate-presets";
import { SensorHzIntervalCard } from "../../shared/SensorHzIntervalCard";
import { SENSOR_CFG_UI } from "../../../constants/sensorConfigUiLabels";
import type { Dps368MinPublishCardProps } from "../types";
import type { SensorCfgCardApplyProps } from "../../../../sensor-telemetry/components/panels/SensorCfgCardHeaderTrailing.js";

export function DPS368MinPublishIntervalCard(
  props: Dps368MinPublishCardProps & { cardApply?: SensorCfgCardApplyProps },
) {
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
      rateField={{ allowZero: true }}
    />
  );
}
