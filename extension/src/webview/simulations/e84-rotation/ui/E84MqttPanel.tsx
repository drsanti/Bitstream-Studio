/*******************************************************************************
 * File Name : E84MqttPanel.tsx
 *
 * Description : MQTT connect and rotation telemetry publish for E84 sim.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { Radio, Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  TRNAccordion,
  TRNAccordionContent,
  TRNAccordionItem,
  TRNAccordionTrigger,
  TRNButton,
  TRNHintText,
  TRNParameterSlider,
  TRNSectionContainer,
  TRNSettingRow,
} from "../../../ui/TRN/index.js";
import { useSimulationMqtt } from "../../shared/mqtt/useSimulationMqtt.js";
import { RotationDegPlotter } from "../../shared/ui/RotationDegPlotter.js";
import { useRotationDegHistory } from "../../shared/ui/useRotationDegHistory.js";
import {
  buildE84TelemetryTopic,
  type E84TelemetryPayload,
} from "../mqtt/e84MqttTopics.js";
import { useE84MovementStore } from "../store/e84Movement.store.js";

const DEVICE_ID_STORAGE_KEY = "bitstream-studio.e84-rotation.deviceId.v1";

function loadDeviceId(): string
{
  if (typeof window === "undefined")
  {
    return "e84-sim";
  }
  try
  {
    return window.localStorage.getItem(DEVICE_ID_STORAGE_KEY) ?? "e84-sim";
  }
  catch
  {
    return "e84-sim";
  }
}

/**
 * Right panel: broker connection, device id, publish start/stop, plotter.
 */
export function E84MqttPanel()
{
  const mqtt = useSimulationMqtt();
  const isPublishing = useE84MovementStore((s) => s.isPublishing);
  const setIsPublishing = useE84MovementStore((s) => s.setIsPublishing);
  const settings = useE84MovementStore((s) => s.settings);
  const updateSetting = useE84MovementStore((s) => s.updateSetting);
  const liveRotationDeg = useE84MovementStore((s) => s.liveRotationDeg);

  const [deviceId, setDeviceId] = useState(loadDeviceId);
  const [brokerUrl, setBrokerUrl] = useState("ws://127.0.0.1:8883/mqtt");
  const [lastPublished, setLastPublished] = useState<E84TelemetryPayload | null>(null);
  const [sampleCount, setSampleCount] = useState(0);
  const [scrollThreshold, setScrollThreshold] = useState(256);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const history = useRotationDegHistory(
    () => useE84MovementStore.getState().liveRotationDeg,
    isPublishing && mqtt.isConnected,
    scrollThreshold,
  );

  const plotSeries = useMemo(
    () => [
      { data: history.x, color: "#ef4444", label: "Rot X" },
      { data: history.y, color: "#22c55e", label: "Rot Y" },
      { data: history.z, color: "#3b82f6", label: "Rot Z" },
    ],
    [history.version, history.x, history.y, history.z],
  );

  useEffect(() =>
  {
    try
    {
      window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
    }
    catch
    {
      // ignore
    }
  }, [deviceId]);

  useEffect(() =>
  {
    if (intervalRef.current != null)
    {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isPublishing || !mqtt.isConnected || liveRotationDeg == null)
    {
      return;
    }

    const topic = buildE84TelemetryTopic(deviceId);
    if (topic.length === 0)
    {
      return;
    }

    const publishOnce = (): void =>
    {
      const payload: E84TelemetryPayload = {
        x: Math.round(liveRotationDeg.x * 100) / 100,
        y: Math.round(liveRotationDeg.y * 100) / 100,
        z: Math.round(liveRotationDeg.z * 100) / 100,
        timestamp: Date.now(),
      };
      mqtt.publish(topic, JSON.stringify(payload));
      setLastPublished(payload);
      setSampleCount((c) => c + 1);
    };

    publishOnce();
    intervalRef.current = setInterval(publishOnce, settings.publishingRateMs);

    return () =>
    {
      if (intervalRef.current != null)
      {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [deviceId, isPublishing, liveRotationDeg, mqtt, settings.publishingRateMs]);

  const topic = buildE84TelemetryTopic(deviceId);

  return (
    <div className="flex flex-col gap-3">
      <TRNSettingRow
        label="MQTT"
        valueText={mqtt.isConnected ? "Connected" : "Disconnected"}
      />

      <TRNAccordion type="multiple" defaultValue={["conn", "publish"]}>
        <TRNAccordionItem value="conn">
          <TRNAccordionTrigger>
            <span className="flex items-center gap-2">
              <Radio className="h-3.5 w-3.5" />
              Connection
            </span>
          </TRNAccordionTrigger>
          <TRNAccordionContent>
            <TRNSectionContainer title="Broker" className="gap-2">
              <label className="flex flex-col gap-1 text-[11px] text-zinc-400">
                WebSocket URL
                <input
                  className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 font-mono text-xs text-zinc-100"
                  value={brokerUrl}
                  onChange={(e) => setBrokerUrl(e.target.value)}
                  disabled={mqtt.isConnected}
                />
              </label>
              <label className="flex flex-col gap-1 text-[11px] text-zinc-400">
                Device ID
                <input
                  className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 font-mono text-xs text-zinc-100"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                />
              </label>
              <TRNHintText className="font-mono text-[10px]">
                {topic.length > 0 ? topic : "Set device ID for topic"}
              </TRNHintText>
              <div className="flex flex-wrap gap-2 pt-1">
                {!mqtt.isConnected ? (
                  <TRNButton
                    size="compact"
                    onClick={() => void mqtt.connect(brokerUrl).catch(() => undefined)}
                  >
                    Connect
                  </TRNButton>
                ) : (
                  <TRNButton size="compact" onClick={() => void mqtt.disconnect()}>
                    Disconnect
                  </TRNButton>
                )}
              </div>
              {mqtt.lastError != null ? (
                <p className="text-xs text-red-300">{mqtt.lastError}</p>
              ) : null}
            </TRNSectionContainer>
          </TRNAccordionContent>
        </TRNAccordionItem>

        <TRNAccordionItem value="publish">
          <TRNAccordionTrigger>
            <span className="flex items-center gap-2">
              <Send className="h-3.5 w-3.5" />
              Telemetry publish
            </span>
          </TRNAccordionTrigger>
          <TRNAccordionContent>
            <div className="flex flex-wrap gap-2">
              <TRNButton
                size="compact"
                selected={isPublishing}
                disabled={!mqtt.isConnected}
                onClick={() => setIsPublishing(!isPublishing)}
              >
                {isPublishing ? "Stop publishing" : "Start publishing"}
              </TRNButton>
            </div>
            <TRNParameterSlider
              name="Publish interval"
              value={settings.publishingRateMs}
              min={100}
              max={2000}
              step={50}
              unit="ms"
              onChange={(v) => updateSetting("publishingRateMs", v)}
              valueFormatter={(v) =>
                `${Math.round(v)} ms (${(1000 / v).toFixed(1)} Hz)`
              }
            />
            {lastPublished != null ? (
              <div className="rounded border border-zinc-800 bg-zinc-900/60 p-2 text-[11px] text-zinc-400">
                <p>Samples sent: {sampleCount}</p>
                <p>
                  Last: x={lastPublished.x} y={lastPublished.y} z={lastPublished.z}
                </p>
              </div>
            ) : null}
            <RotationDegPlotter
              series={plotSeries}
              scrollThreshold={scrollThreshold}
              live={isPublishing && mqtt.isConnected}
            />
            <TRNParameterSlider
              name="Plot window"
              value={scrollThreshold}
              min={64}
              max={512}
              step={32}
              onChange={setScrollThreshold}
              valueFormatter={(v) => `${Math.round(v)} samples`}
            />
          </TRNAccordionContent>
        </TRNAccordionItem>
      </TRNAccordion>
    </div>
  );
}
