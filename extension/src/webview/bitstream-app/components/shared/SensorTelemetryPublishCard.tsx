import { Radio } from "lucide-react";
import { TRNButton, TRNDragHandle, TRNHintText, TRNInteractiveCard, TRNTransientStatusBadge } from "@/ui/TRN";
import {
  hzFromIntervalMs,
  TELEMETRY_HZ_PRESETS,
} from "../../../../bitstream2/domains/config/sensor-rate-presets";
import { SensorHzRateField } from "./SensorHzRateField";
import type { SensorHzIntervalCardAck } from "./SensorHzIntervalCard";
import { SENSOR_CFG_UI } from "../../constants/sensorConfigUiLabels";

export function SensorTelemetryPublishCard(props: {
  collapsed: boolean;
  controlsDisabled: boolean;
  ack: SensorHzIntervalCardAck;
  publishIntervalMs: number;
  samplingIntervalMs: number;
  onToggleCollapsed: () => void;
  onPublishIntervalMsChange: (nextMs: number) => void;
}) {
  const {
    collapsed,
    controlsDisabled,
    ack,
    publishIntervalMs,
    samplingIntervalMs,
    onToggleCollapsed,
    onPublishIntervalMsChange,
  } = props;

  const minTelemetryMs = samplingIntervalMs > 0 ? samplingIntervalMs : 1;

  return (
    <TRNInteractiveCard
      title={SENSOR_CFG_UI.telemetryRate}
      titleLeadingSlot={
        <TRNDragHandle className="h-5 w-5 border-0 bg-transparent p-0 text-zinc-400 hover:bg-transparent!" />
      }
      titleTrailingSlot={
        <TRNTransientStatusBadge state={ack.state} message={ack.message} />
      }
      headerTitleClassName="normal-case tracking-normal text-zinc-100"
      className="h-auto rounded-md border-zinc-700/80 bg-black/30 p-2"
      collapsible
      collapsed={collapsed}
      onCollapsedChange={(next) => {
        if (next !== collapsed) {
          onToggleCollapsed();
        }
      }}
      contentClassName="min-h-0"
    >
      <div
        className={`flex flex-col gap-2 ${controlsDisabled ? "pointer-events-none opacity-50" : ""}`}
      >
        <TRNHintText tone="info">
          UART event rate. Cannot exceed internal sampling; firmware coerces if faster.
        </TRNHintText>
        <SensorHzRateField
          presets={TELEMETRY_HZ_PRESETS}
          intervalMs={publishIntervalMs === 0 ? minTelemetryMs : publishIntervalMs}
          disabled={controlsDisabled}
          minMs={minTelemetryMs}
          allowZero
          hint={
            publishIntervalMs === 0
              ? "Pick a Hz preset or use Same as sampling below."
              : undefined
          }
          onIntervalMsChange={onPublishIntervalMsChange}
        />
        <TRNButton
          size="compact"
          className="self-start border-zinc-700/80"
          selected={publishIntervalMs === 0}
          disabled={controlsDisabled}
          onClick={() => onPublishIntervalMsChange(0)}
        >
          Same as sampling
        </TRNButton>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Radio className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
          <span>
            {publishIntervalMs === 0
              ? "Publishing at sample rate"
              : `Telemetry ${hzFromIntervalMs(publishIntervalMs)}`}
          </span>
        </div>
      </div>
    </TRNInteractiveCard>
  );
}
