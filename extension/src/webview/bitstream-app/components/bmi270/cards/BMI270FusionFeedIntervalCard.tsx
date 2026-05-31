import { Cpu } from "lucide-react";
import { FUSION_FEED_HZ_PRESETS } from "../../../../../bitstream2/domains/config/sensor-rate-presets";
import { SENSOR_CFG_UI } from "../../../constants/sensorConfigUiLabels";
import { SensorHzIntervalCard } from "../../shared/SensorHzIntervalCard";
import type { Bmi270AckState } from "../types";
import type { SensorCfgCardApplyProps } from "../../../../sensor-telemetry/components/panels/SensorCfgCardHeaderTrailing.js";

export function BMI270FusionFeedIntervalCard(props: {
  collapsed: boolean;
  controlsDisabled: boolean;
  ack: Bmi270AckState;
  fusionFeedIntervalMs: number;
  onToggleCollapsed: () => void;
  onFusionFeedIntervalChange: (nextValue: number) => void;
  cardApply?: SensorCfgCardApplyProps;
}) {
  const {
    collapsed,
    controlsDisabled,
    ack,
    fusionFeedIntervalMs,
    onToggleCollapsed,
    onFusionFeedIntervalChange,
    cardApply,
  } = props;

  return (
    <SensorHzIntervalCard
      title={SENSOR_CFG_UI.fusionFeed}
      icon={Cpu}
      collapsed={collapsed}
      controlsDisabled={controlsDisabled}
      ack={ack}
      intervalMs={fusionFeedIntervalMs}
      presets={FUSION_FEED_HZ_PRESETS}
      onToggleCollapsed={onToggleCollapsed}
      onIntervalMsChange={onFusionFeedIntervalChange}
      cardApply={cardApply}
      rateField={
        controlsDisabled
          ? {
              hint: "Switch stream mode to Fusion or Hybrid to edit the BSX fusion feed rate.",
            }
          : undefined
      }
    />
  );
}
