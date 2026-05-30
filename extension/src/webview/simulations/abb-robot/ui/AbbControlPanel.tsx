/*******************************************************************************
 * File Name : AbbControlPanel.tsx
 *
 * Description : ABB robot joint controls (Link1–Link6).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { CheckCircle, Cpu, SlidersHorizontal, Wifi, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  TRNAccordion,
  TRNAccordionContent,
  TRNAccordionItem,
  TRNAccordionTrigger,
  TRNHintText,
  TRNSectionContainer,
} from "../../../ui/TRN/index.js";
import { ABB_LINK_DEFINITIONS } from "../config/abbLinkDefinitions.js";
import { useAbbRobot } from "../context/AbbRobotContext.js";
import { useAbbMqtt } from "../context/AbbMqttProvider.js";
import type { AbbMqttStats } from "../controller/ArmController.js";
import { useAbbRobotStore } from "../store/abbRobot.store.js";
import { AbbLinkControl } from "./AbbLinkControl.js";

/**
 * Left panel: control mode + per-link sliders.
 */
export function AbbControlPanel()
{
  const { controller, linksReady } = useAbbRobot();
  const controlMode = useAbbRobotStore((s) => s.controlMode);
  const setControlMode = useAbbRobotStore((s) => s.setControlMode);
  const mqtt = useAbbMqtt();
  const [stats, setStats] = useState<AbbMqttStats | null>(null);

  useEffect(() =>
  {
    const id = window.setInterval(() =>
    {
      setStats(controller?.getMqttStats() ?? null);
    }, 400);
    return () => window.clearInterval(id);
  }, [controller]);

  if (!linksReady)
  {
    return (
      <p className="text-xs text-amber-300/90">
        Waiting for Link1–Link6 in the GLB. Check the model asset is packed.
      </p>
    );
  }

  return (
    <div className="flex max-h-[calc(100vh-8rem)] flex-col gap-3 overflow-y-auto pr-1">
      <TRNSectionContainer title="Robot arm">
        <p className="flex items-center gap-2 text-[11px] text-zinc-400">
          {controller != null ? (
            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <XCircle className="h-3.5 w-3.5 text-red-400" />
          )}
          {controller != null ? "Controller ready" : "Controller unavailable"}
        </p>
      </TRNSectionContainer>

      <TRNSectionContainer title="Control mode">
        <div className="flex gap-1">
          <ModeChip
            active={controlMode === "direct"}
            label="Direct"
            icon={<Cpu className="h-3 w-3" />}
            onClick={() => setControlMode("direct")}
          />
          <ModeChip
            active={controlMode === "mqtt"}
            label="MQTT"
            icon={<Wifi className="h-3 w-3" />}
            onClick={() => setControlMode("mqtt")}
          />
        </div>
        <TRNHintText>
          {controlMode === "direct"
            ? "Moves the arm locally without publishing commands."
            : "Publishes to robot/actuators (requires MQTT connect on the right)."}
        </TRNHintText>
      </TRNSectionContainer>

      <TRNAccordion
        type="multiple"
        defaultValue={ABB_LINK_DEFINITIONS.map((d) => d.name)}
      >
        {ABB_LINK_DEFINITIONS.map((def, index) => (
          <TRNAccordionItem key={def.name} value={def.name}>
            <TRNAccordionTrigger>
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {def.name}
              </span>
            </TRNAccordionTrigger>
            <TRNAccordionContent>
              <AbbLinkControl
                linkId={index}
                controller={controller}
                controlMode={controlMode}
                mqttConnected={mqtt.isConnected}
              />
            </TRNAccordionContent>
          </TRNAccordionItem>
        ))}
      </TRNAccordion>

      {stats != null && controlMode === "mqtt" ? (
        <TRNHintText className="font-mono text-[10px]">
          MQTT sent {stats.sentCount} · received {stats.receivedCount}
        </TRNHintText>
      ) : null}
    </div>
  );
}

function ModeChip({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
})
{
  return (
    <button
      type="button"
      className={
        active
          ? "flex flex-1 items-center justify-center gap-1 rounded-md border border-sky-500/40 bg-sky-950/50 py-1.5 text-[11px] text-sky-100"
          : "flex flex-1 items-center justify-center gap-1 rounded-md border border-zinc-700 py-1.5 text-[11px] text-zinc-400 hover:bg-zinc-900"
      }
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}
