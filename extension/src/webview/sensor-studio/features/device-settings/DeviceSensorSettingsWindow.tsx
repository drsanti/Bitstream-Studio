import { useCallback, useEffect, useMemo, useState } from "react";
import {
  TRNTabs,
  TRNTabsContent,
  TRNTabsList,
  TRNTabsTrigger,
  TRNWindow,
} from "@/ui/TRN";
import { executeBitstreamCommand } from "../../../../bitstream/command-api/bitstreamCommandExecutor";
import {
  SENSOR_SOURCE_ID_BMI270,
  SENSOR_SOURCE_ID_BMM350,
  SENSOR_SOURCE_ID_DPS368,
  SENSOR_SOURCE_ID_SHT40,
} from "../../../bitstream-app/constants/sensorSourceIds";
import { BMI270ControlPanel } from "../../../bitstream-app/components/bmi270/BMI270ControlPanel";
import { BMM350ControlPanel } from "../../../bitstream-app/components/bmm350/BMM350ControlPanel";
import { DPS368ControlPanel } from "../../../bitstream-app/components/dps368/DPS368ControlPanel";
import { SHT40ControlPanel } from "../../../bitstream-app/components/sht40/SHT40ControlPanel";
import { useBitstreamAppControl } from "../../../bitstream-app/BitstreamAppWrapper";
import { useBitstreamTransportActionsOptional } from "../../../bitstream-app/context/bitstreamTransportActions.context";
import { useBitstreamConfigStore } from "../../../bitstream-app/state/bitstreamConfig.store";
import {
  mergeVerifiedDeviceSensorConfig,
  useBitstreamDeviceSensorConfigStore,
} from "../../../bitstream-app/state/bitstreamDeviceSensorConfig.store";
import { useBitstreamConnectionStore } from "../../../bitstream-app/state/bitstreamConnection.store";

type DeviceSensorSettingsTab = "bmi270" | "dps368" | "sht40" | "bmm350";

type SensorPublishMode = 0 | 1 | 2;

function coercePublishMode(value: number): SensorPublishMode {
  return value === 0 || value === 1 || value === 2 ? value : 2;
}

function resolveDefaultTab(initialSourceId: number | null): DeviceSensorSettingsTab {
  switch (initialSourceId) {
    case SENSOR_SOURCE_ID_DPS368:
      return "dps368";
    case SENSOR_SOURCE_ID_SHT40:
      return "sht40";
    case SENSOR_SOURCE_ID_BMM350:
      return "bmm350";
    case SENSOR_SOURCE_ID_BMI270:
    default:
      return "bmi270";
  }
}

export function DeviceSensorSettingsWindow(props: {
  open: boolean;
  onClose: () => void;
  initialSourceId?: number | null;
}) {
  const { open, onClose, initialSourceId = null } = props;

  const runtimeReady = useBitstreamConnectionStore((s) => s.runtimeReady);
  const transportState = useBitstreamConnectionStore((s) => s.transportState);
  const { getSensorConfig, setSensorConfig, sensorConfigAck } = useBitstreamAppControl();
  const transportActions = useBitstreamTransportActionsOptional();
  const bitstreamShellAvailable = transportActions != null;

  const bmi270FusionFeedIntervalMs = useBitstreamConfigStore(
    (s) => s.bmi270FusionFeedIntervalMs,
  );

  const bySourceId = useBitstreamDeviceSensorConfigStore((s) => s.bySourceId);

  const rows = useMemo(() => {
    return {
      bmi270: bySourceId[SENSOR_SOURCE_ID_BMI270] ?? null,
      dps368: bySourceId[SENSOR_SOURCE_ID_DPS368] ?? null,
      sht40: bySourceId[SENSOR_SOURCE_ID_SHT40] ?? null,
      bmm350: bySourceId[SENSOR_SOURCE_ID_BMM350] ?? null,
    };
  }, [bySourceId]);

  const [tab, setTab] = useState<DeviceSensorSettingsTab>(() => resolveDefaultTab(initialSourceId));

  useEffect(() => {
    if (!open) {
      return;
    }
    setTab(resolveDefaultTab(initialSourceId));
  }, [initialSourceId, open]);

  useEffect(() => {
    if (!open || !runtimeReady || !bitstreamShellAvailable) {
      return;
    }
    let cancelled = false;
    void (async () => {
      const sourceIds = [
        SENSOR_SOURCE_ID_BMI270,
        SENSOR_SOURCE_ID_DPS368,
        SENSOR_SOURCE_ID_SHT40,
        SENSOR_SOURCE_ID_BMM350,
      ];
      for (const sourceId of sourceIds) {
        const cfg = await getSensorConfig(sourceId);
        if (cancelled || !cfg) {
          continue;
        }
        mergeVerifiedDeviceSensorConfig({
          sourceId,
          enabled: cfg.enabled,
          publishMode: cfg.publishMode,
          mask: 0xff,
          samplingIntervalMs: cfg.samplingIntervalMs,
          deltaX100: cfg.deltaX100,
          minPublishIntervalMs: cfg.minPublishIntervalMs,
          publishIntervalMs: cfg.publishIntervalMs ?? 0,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bitstreamShellAvailable, getSensorConfig, open, runtimeReady]);

  const connectionHint = !bitstreamShellAvailable
    ? "Bitstream shell not available — firmware commands are disabled (launch Sensor Studio from Bitstream with ?app=sensor-studio)."
    : runtimeReady
      ? "Changes apply to all connected clients for this device."
      : transportState === "connected" ||
          transportState === "connecting" ||
          transportState === "reconnecting"
        ? "Waiting for runtime to become ready…"
        : "Transport not connected. Connect first to apply settings.";

  const [fusionFeedAck, setFusionFeedAck] = useState<{
    state: "idle" | "pending" | "ok" | "error";
    message?: string;
  }>({ state: "idle" });

  const handleFusionFeedIntervalChange = useCallback(
    (nextValue: number) => {
      if (transportActions == null) {
        setFusionFeedAck({
          state: "error",
          message: "Bitstream shell not available",
        });
        return;
      }
      const { publishBmi270FusionFeedUpdated, requireConnectedSession, runAction } =
        transportActions;
      const clamped = Math.max(1, Math.min(30_000, Math.round(nextValue)));
      setFusionFeedAck({
        state: "pending",
        message: "Applying fusion feed interval...",
      });
      void runAction("BMI270 fusion feed interval", async () => {
        const session = requireConnectedSession("BMI270 fusion feed interval");
        if (!session) {
          setFusionFeedAck({ state: "error", message: "Transport not connected" });
          return;
        }
        const result = await executeBitstreamCommand(session, {
          type: "sensor.bmi270.fusion.feed.set",
          payload: {
            requestId: `sensor-studio-bmi270-fusion-feed-${Date.now()}`,
            intervalMs: clamped,
          },
        });
        if (!result.ok || !result.data) {
          setFusionFeedAck({
            state: "error",
            message: result.error ?? "Fusion feed interval rejected",
          });
          return;
        }
        useBitstreamConfigStore
          .getState()
          .setBmi270FusionFeedIntervalMs(result.data.appliedIntervalMs);
        publishBmi270FusionFeedUpdated({
          appliedIntervalMs: result.data.appliedIntervalMs,
          timestampMs: Date.now(),
        });
        setFusionFeedAck({
          state: "ok",
          message: `Applied ${result.data.appliedIntervalMs} ms`,
        });
      });
    },
    [transportActions],
  );

  const rowFallback = useMemo(
    () => ({
      enabled: false,
      publishMode: 2,
      samplingIntervalMs: 200,
      deltaX100: 0,
      minPublishIntervalMs: 200,
    }),
    [],
  );

  const bmi270 = rows.bmi270 ?? rowFallback;
  const dps368 = rows.dps368 ?? rowFallback;
  const sht40 = rows.sht40 ?? rowFallback;
  const bmm350 = rows.bmm350 ?? rowFallback;

  return (
    <TRNWindow
      open={open}
      title="Device sensor settings"
      onClose={onClose}
      initialRect={{ x: 90, y: 70, width: 860, height: 640 }}
      minWidth={640}
      minHeight={420}
      modal
      glass
      glassPreset="medium"
      persistRectStorageKey="sensor-studio:device-sensor-settings-window"
      contentClassName="min-h-0 overflow-hidden"
      zIndex={78}
    >
      <div className="flex h-full min-h-0 flex-col gap-2">
        <div className="rounded border border-amber-700/40 bg-amber-950/25 px-2 py-1 text-[11px] leading-snug text-amber-100/90">
          <div className="font-semibold">Shared device settings</div>
          <div className="text-amber-100/80">{connectionHint}</div>
        </div>

        {!bitstreamShellAvailable ? (
          <div className="flex min-h-0 flex-1 flex-col justify-center gap-2 rounded border border-rose-800/50 bg-rose-950/20 px-3 py-4 text-xs leading-relaxed text-rose-100/90">
            <div className="font-semibold text-rose-100">
              Device sensor controls unavailable
            </div>
            <p className="text-rose-100/85">
              This window applies firmware settings through the Bitstream session. Run Sensor Studio inside{" "}
              <span className="font-mono text-[11px] text-rose-50">BitstreamAppWrapper</span> (Bitstream app with{" "}
              <span className="font-mono text-[11px] text-rose-50">?app=sensor-studio</span>) so transport actions are
              wired.
            </p>
            <p className="text-[11px] text-rose-100/70">
              Last-known rows may still appear in the Inspector from{" "}
              <span className="font-mono">useBitstreamDeviceSensorConfigStore</span> if another instance synced earlier.
            </p>
          </div>
        ) : (
          <TRNTabs
            value={tab}
            onValueChange={(next) => setTab(next as DeviceSensorSettingsTab)}
            lazyMount
            className="flex min-h-0 flex-1 flex-col gap-2"
          >
          <TRNTabsList className="w-full shrink-0">
            <TRNTabsTrigger value="bmi270" className="flex-1">
              BMI270
            </TRNTabsTrigger>
            <TRNTabsTrigger value="dps368" className="flex-1">
              DPS368
            </TRNTabsTrigger>
            <TRNTabsTrigger value="sht40" className="flex-1">
              SHT40
            </TRNTabsTrigger>
            <TRNTabsTrigger value="bmm350" className="flex-1">
              BMM350
            </TRNTabsTrigger>
          </TRNTabsList>

          <TRNTabsContent
            value="bmi270"
            keepMounted={false}
            className="mt-0 min-h-0 flex-1 overflow-y-auto"
          >
            <BMI270ControlPanel
              enabled={bmi270.enabled}
              onEnabledChange={(v) => setSensorConfig(SENSOR_SOURCE_ID_BMI270, { enabled: v })}
              dataRateMs={bmi270.samplingIntervalMs}
              onSamplingIntervalChange={(v) =>
                setSensorConfig(SENSOR_SOURCE_ID_BMI270, { samplingIntervalMs: v })
              }
              publishMode={coercePublishMode(bmi270.publishMode)}
              onPublishModeChange={(v) =>
                setSensorConfig(SENSOR_SOURCE_ID_BMI270, { publishMode: v as number })
              }
              deltaX100={bmi270.deltaX100}
              onDeltaX100Change={(v) => setSensorConfig(SENSOR_SOURCE_ID_BMI270, { deltaX100: v })}
              minPublishIntervalMs={bmi270.minPublishIntervalMs}
              onMinPublishIntervalMsChange={(v) =>
                setSensorConfig(SENSOR_SOURCE_ID_BMI270, { minPublishIntervalMs: v })
              }
              ack={sensorConfigAck}
              ackSensorSourceId={SENSOR_SOURCE_ID_BMI270}
              fusionFeedIntervalMs={bmi270FusionFeedIntervalMs}
              onFusionFeedIntervalChange={handleFusionFeedIntervalChange}
              fusionFeedAck={fusionFeedAck}
            />
          </TRNTabsContent>

          <TRNTabsContent
            value="dps368"
            keepMounted={false}
            className="mt-0 min-h-0 flex-1 overflow-y-auto"
          >
            <DPS368ControlPanel
              enabled={dps368.enabled}
              onEnabledChange={(v) => setSensorConfig(SENSOR_SOURCE_ID_DPS368, { enabled: v })}
              dataRateMs={dps368.samplingIntervalMs}
              onSamplingIntervalChange={(v) =>
                setSensorConfig(SENSOR_SOURCE_ID_DPS368, { samplingIntervalMs: v })
              }
              publishMode={coercePublishMode(dps368.publishMode)}
              onPublishModeChange={(v) =>
                setSensorConfig(SENSOR_SOURCE_ID_DPS368, { publishMode: v as number })
              }
              deltaX100={dps368.deltaX100}
              onDeltaX100Change={(v) => setSensorConfig(SENSOR_SOURCE_ID_DPS368, { deltaX100: v })}
              minPublishIntervalMs={dps368.minPublishIntervalMs}
              onMinPublishIntervalMsChange={(v) =>
                setSensorConfig(SENSOR_SOURCE_ID_DPS368, { minPublishIntervalMs: v })
              }
              ack={sensorConfigAck}
              ackSensorSourceId={SENSOR_SOURCE_ID_DPS368}
            />
          </TRNTabsContent>

          <TRNTabsContent
            value="sht40"
            keepMounted={false}
            className="mt-0 min-h-0 flex-1 overflow-y-auto"
          >
            <SHT40ControlPanel
              enabled={sht40.enabled}
              onEnabledChange={(v) => setSensorConfig(SENSOR_SOURCE_ID_SHT40, { enabled: v })}
              dataRateMs={sht40.samplingIntervalMs}
              onSamplingIntervalChange={(v) =>
                setSensorConfig(SENSOR_SOURCE_ID_SHT40, { samplingIntervalMs: v })
              }
              publishMode={coercePublishMode(sht40.publishMode)}
              onPublishModeChange={(v) =>
                setSensorConfig(SENSOR_SOURCE_ID_SHT40, { publishMode: v as number })
              }
              deltaX100={sht40.deltaX100}
              onDeltaX100Change={(v) => setSensorConfig(SENSOR_SOURCE_ID_SHT40, { deltaX100: v })}
              minPublishIntervalMs={sht40.minPublishIntervalMs}
              onMinPublishIntervalMsChange={(v) =>
                setSensorConfig(SENSOR_SOURCE_ID_SHT40, { minPublishIntervalMs: v })
              }
              ack={sensorConfigAck}
              ackSensorSourceId={SENSOR_SOURCE_ID_SHT40}
            />
          </TRNTabsContent>

          <TRNTabsContent
            value="bmm350"
            keepMounted={false}
            className="mt-0 min-h-0 flex-1 overflow-y-auto"
          >
            <BMM350ControlPanel
              enabled={bmm350.enabled}
              onEnabledChange={(v) => setSensorConfig(SENSOR_SOURCE_ID_BMM350, { enabled: v })}
              dataRateMs={bmm350.samplingIntervalMs}
              onSamplingIntervalChange={(v) =>
                setSensorConfig(SENSOR_SOURCE_ID_BMM350, { samplingIntervalMs: v })
              }
              publishMode={coercePublishMode(bmm350.publishMode)}
              onPublishModeChange={(v) =>
                setSensorConfig(SENSOR_SOURCE_ID_BMM350, { publishMode: v as number })
              }
              deltaX100={bmm350.deltaX100}
              onDeltaX100Change={(v) => setSensorConfig(SENSOR_SOURCE_ID_BMM350, { deltaX100: v })}
              minPublishIntervalMs={bmm350.minPublishIntervalMs}
              onMinPublishIntervalMsChange={(v) =>
                setSensorConfig(SENSOR_SOURCE_ID_BMM350, { minPublishIntervalMs: v })
              }
              ack={sensorConfigAck}
              ackSensorSourceId={SENSOR_SOURCE_ID_BMM350}
            />
          </TRNTabsContent>
          </TRNTabs>
        )}
      </div>
    </TRNWindow>
  );
}

