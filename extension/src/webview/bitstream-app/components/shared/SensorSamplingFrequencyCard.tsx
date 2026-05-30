import type { LucideIcon } from "lucide-react";
import { Activity } from "lucide-react";
import { CFG_ACCESS_UI_HINT } from "../../../../bitstream2/domains/config/sensor-cfg-access-policy";
import { SensorHzIntervalCard, type SensorHzIntervalCardAck } from "./SensorHzIntervalCard";
import type { HzPreset } from "../../../../bitstream2/domains/config/sensor-rate-presets";
import { SENSOR_CFG_UI } from "../../constants/sensorConfigUiLabels";
import type { SensorCfgCardApplyProps } from "../../../sensor-telemetry/components/panels/SensorCfgCardHeaderTrailing.js";

export function SensorSamplingFrequencyCard(props: {
  collapsed: boolean;
  controlsDisabled?: boolean;
  ack: SensorHzIntervalCardAck;
  samplingIntervalMs: number;
  presets: HzPreset[];
  icon?: LucideIcon;
  onToggleCollapsed: () => void;
  onSamplingFrequencyChange: (samplingIntervalMs: number) => void;
  rateField?: { minMs?: number; maxMs?: number };
  hint?: string;
  /** When true, no footer hint under the rate slider (overrides `hint`). */
  suppressHint?: boolean;
  cardApply?: SensorCfgCardApplyProps;
}) {
  const {
    collapsed,
    controlsDisabled = false,
    ack,
    samplingIntervalMs,
    presets,
    icon = Activity,
    onToggleCollapsed,
    onSamplingFrequencyChange,
    rateField,
    hint,
    suppressHint = false,
    cardApply,
  } = props;

  const rateHint = suppressHint
    ? undefined
    : (hint ??
      `Sample and UART telemetry use this rate (publishIntervalMs = same as sampling). ${CFG_ACCESS_UI_HINT}`);

  return (
    <SensorHzIntervalCard
      title={SENSOR_CFG_UI.sampleRate}
      icon={icon}
      collapsed={collapsed}
      controlsDisabled={controlsDisabled}
      ack={ack}
      intervalMs={samplingIntervalMs}
      presets={presets}
      onToggleCollapsed={onToggleCollapsed}
      onIntervalMsChange={onSamplingFrequencyChange}
      cardApply={cardApply}
      rateField={{
        ...(rateField?.minMs != null ? { minMs: rateField.minMs } : {}),
        ...(rateField?.maxMs != null ? { maxMs: rateField.maxMs } : {}),
        ...(rateHint != null && rateHint.length > 0 ? { hint: rateHint } : {}),
      }}
    />
  );
}
