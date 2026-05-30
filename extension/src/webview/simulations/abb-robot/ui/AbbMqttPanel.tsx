/*******************************************************************************
 * File Name : AbbMqttPanel.tsx
 *
 * Description : MQTT broker connect and stats for ABB robot sim.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { Activity, Inbox, Radio, Send, Server } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import {
  TRNAccordion,
  TRNAccordionContent,
  TRNAccordionItem,
  TRNAccordionTrigger,
  TRNButton,
  TRNHintText,
  TRNSettingRow,
  TRNSectionContainer,
} from "../../../ui/TRN/index.js";
import { useAbbRobot } from "../context/AbbRobotContext.js";
import { useAbbMqtt } from "../context/AbbMqttProvider.js";
import type { AbbMqttStats } from "../controller/ArmController.js";

/**
 * Right panel: broker URL, connect/disconnect, MQTT stats.
 */
export function AbbMqttPanel()
{
  const mqtt = useAbbMqtt();
  const { controller, linksReady } = useAbbRobot();
  const [brokerUrl, setBrokerUrl] = useState("ws://127.0.0.1:8883/mqtt");
  const [stats, setStats] = useState<AbbMqttStats | null>(null);

  useEffect(() =>
  {
    const id = window.setInterval(() =>
    {
      setStats(controller?.getMqttStats() ?? null);
    }, 400);
    return () => window.clearInterval(id);
  }, [controller]);

  return (
    <div className="flex flex-col gap-3">
      <TRNSettingRow
        label="MQTT"
        valueText={mqtt.isConnected ? "Connected" : "Disconnected"}
      />

      {!linksReady ? (
        <p className="text-xs text-amber-300/90">Arm links not ready.</p>
      ) : null}

      <TRNAccordion type="multiple" defaultValue={["conn", "topics", "metrics"]}>
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
              <div className="flex flex-wrap gap-2">
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

        <TRNAccordionItem value="topics">
          <TRNAccordionTrigger>
            <span className="flex items-center gap-2">
              <Server className="h-3.5 w-3.5" />
              Topics
            </span>
          </TRNAccordionTrigger>
          <TRNAccordionContent>
            <TRNHintText className="font-mono text-[10px]">
              Subscribe: robot/actuators, robot/sensors/get
            </TRNHintText>
            <TRNHintText className="font-mono text-[10px]">
              Publish: robot/sensors
            </TRNHintText>
          </TRNAccordionContent>
        </TRNAccordionItem>

        <TRNAccordionItem value="metrics">
          <TRNAccordionTrigger>
            <span className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5" />
              Message metrics
            </span>
          </TRNAccordionTrigger>
          <TRNAccordionContent>
            {stats != null ? (
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <MetricCard
                  icon={<Send className="h-3 w-3" />}
                  label="Sent"
                  value={stats.sentCount}
                />
                <MetricCard
                  icon={<Inbox className="h-3 w-3" />}
                  label="Received"
                  value={stats.receivedCount}
                />
              </div>
            ) : null}
            {stats?.lastTopic != null ? (
              <TRNHintText className="mt-2 font-mono text-[10px]">
                Last {stats.lastDirection ?? "?"} · {stats.lastTopic}
                {stats.lastTimestamp != null
                  ? ` · ${new Date(stats.lastTimestamp).toLocaleTimeString()}`
                  : ""}
              </TRNHintText>
            ) : null}
            {stats?.lastError != null ? (
              <p className="mt-2 text-xs text-red-300">{stats.lastError}</p>
            ) : null}
          </TRNAccordionContent>
        </TRNAccordionItem>
      </TRNAccordion>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
})
{
  return (
    <div className="rounded border border-zinc-800 bg-zinc-900/60 px-2 py-2">
      <div className="mb-1 flex items-center gap-1 text-zinc-500">
        {icon}
        {label}
      </div>
      <div className="font-semibold tabular-nums text-zinc-100">{value}</div>
    </div>
  );
}
