import { TRNHintText } from "@/ui/TRN";
import { useBitstreamTransportActionsOptional } from "../../../context/bitstreamTransportActions.context.js";
import type { DeviceSensorConfigRow } from "../../../state/bitstreamDeviceSensorConfig.store.js";
import { effectiveSensorPublishIntervalMs } from "../../../utils/sensorPublishInterval.js";
import { formatDevicePublishModeLabel } from "./formatDevicePublishMode.js";
import { SENSOR_CFG_UI } from "../../../constants/sensorConfigUiLabels";
import { SensorConfigMetricRow } from "./SensorConfigMetricRow";

function formatHzFromMs(ms: number): string
{
  if (!Number.isFinite(ms) || ms <= 0)
  {
    return "—";
  }
  const hz = 1000 / ms;
  if (!Number.isFinite(hz))
  {
    return "—";
  }
  if (hz >= 100)
  {
    return `${Math.round(hz)} Hz`;
  }
  if (hz >= 10)
  {
    return `${hz.toFixed(1)} Hz`;
  }
  return `${hz.toFixed(2)} Hz`;
}

function formatLocalTime(tsMs: number): string
{
  if (!Number.isFinite(tsMs) || tsMs <= 0)
  {
    return "—";
  }
  try
  {
    return new Date(tsMs).toLocaleString();
  }
  catch
  {
    return String(tsMs);
  }
}

function publishIntervalHint(publishMode: number, samplingIntervalMs: number, publishIntervalMs: number): string
{
  if (publishMode === 1)
  {
    return "Change mode: publishIntervalMs is typically 0; publishes are event-driven (delta / min interval).";
  }
  if (publishIntervalMs > 0)
  {
    return "Explicit publishIntervalMs on device (v2.1).";
  }
  return `publishIntervalMs is 0 → firmware uses sampling interval (${samplingIntervalMs} ms) for periodic UART publish.`;
}

export function DeviceSensorConfigSummaryPanel(props: {
  sensorTitle: string;
  row: DeviceSensorConfigRow | undefined;
})
{
  const { sensorTitle, row } = props;
  const transportActions = useBitstreamTransportActionsOptional();

  if (row == null)
  {
    return (
      <div className="flex min-h-0 flex-col gap-2">
        <TRNHintText tone="warn" className="mb-0 text-[11px]">
          No device parameters for <span className="font-mono">{sensorTitle}</span> yet (waiting for BS2 / bridge sync).
        </TRNHintText>
      </div>
    );
  }

  /* Only `updatedAtMs > 0` rows are merged from firmware GET / BS2 SENSOR_CFG_GET — never show UI seeds as device truth. */
  if (row.updatedAtMs <= 0)
  {
    return (
      <div className="flex min-h-0 flex-col gap-2">
        <TRNHintText tone="warn" className="mb-0 text-[11px] leading-snug">
          No live parameters from firmware for <span className="font-mono">{sensorTitle}</span> yet.
        </TRNHintText>
        <TRNHintText tone="muted" className="mb-0 text-[10px] leading-snug">
          {transportActions != null ? (
            <>
              Press <span className="font-semibold text-zinc-300">Refresh</span> in Sensor parameters (device) after the link is ready — that issues a firmware read (BS2{" "}
              <span className="font-mono">SENSOR_CFG_GET</span> sweep or legacy <span className="font-mono">sensor.cfg.get</span>).
            </>
          ) : (
            <>Firmware reads run from the Bitstream shell (transport context not mounted here).</>
          )}
        </TRNHintText>
      </div>
    );
  }

  const effectivePubMs = effectiveSensorPublishIntervalMs(row.samplingIntervalMs, row.publishIntervalMs);

  return (
    <div className="flex min-h-0 flex-col gap-2 overflow-y-auto">
      <TRNHintText tone="info" className="mb-0 text-[10px] leading-snug">
        From firmware (last read {formatLocalTime(row.updatedAtMs)}).
      </TRNHintText>

      <SensorConfigMetricRow
        label="Sensor active"
        value={row.enabled ? "Yes" : "No"}
        hint="Whether this stream is enabled on the device."
      />

      <SensorConfigMetricRow
        label={SENSOR_CFG_UI.telemetryMode}
        value={
          <span>
            <span className="text-zinc-100">{formatDevicePublishModeLabel(row.publishMode)}</span>
            <span className="ml-1.5 font-mono text-[10px] text-zinc-500">({row.publishMode})</span>
          </span>
        }
        hint="Periodic = fixed cadence; On change = when readings move enough; Hybrid = both."
      />

      <SensorConfigMetricRow
        label={SENSOR_CFG_UI.sampleRate}
        value={
          <span>
            <span className="text-zinc-100">{formatHzFromMs(row.samplingIntervalMs)}</span>
            <span className="ml-1.5 text-zinc-500">
              <span className="font-mono">{row.samplingIntervalMs}</span> ms
            </span>
          </span>
        }
        hint="How often the firmware samples this sensor."
      />

      <SensorConfigMetricRow
        label={SENSOR_CFG_UI.telemetryRate}
        value={
          <span>
            <span className="text-zinc-100">{formatHzFromMs(effectivePubMs)}</span>
            <span className="ml-1.5 text-zinc-500">
              <span className="font-mono">{effectivePubMs}</span> ms
            </span>
          </span>
        }
        hint="Effective telemetry cadence on UART (uses dedicated publish interval when set, otherwise sampling interval)."
      />

      <SensorConfigMetricRow
        label="Publish interval (override)"
        value={<span className="font-mono">{row.publishIntervalMs}</span>}
        hint={publishIntervalHint(row.publishMode, row.samplingIntervalMs, row.publishIntervalMs)}
      />

      <SensorConfigMetricRow
        label="Change threshold (×100)"
        value={<span className="font-mono">{row.deltaX100}</span>}
        hint="Used in On change / Hybrid when comparing successive samples."
      />

      <SensorConfigMetricRow
        label="Min time between publishes"
        value={<span className="font-mono">{row.minPublishIntervalMs}</span>}
        hint="Floor between UART publishes in change-style modes (milliseconds)."
      />

      <SensorConfigMetricRow
        label="Last device update"
        value={<span className="text-[10px] text-zinc-300">{formatLocalTime(row.updatedAtMs)}</span>}
        hint="When these parameters were last refreshed from the device."
      />
    </div>
  );
}
