/*******************************************************************************
 * File Name : LabHealthStrip.tsx
 *
 * Description : Compact health chips for broker, serial, BS2, and loopback.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import type { LabHealthTone } from "../types/labTypes";
import { useLabWorkbenchShell } from "../workbench/lab-workbench-context";

function chipClass(tone: LabHealthTone): string {
  if (tone === "ok")
  {
    return "text-emerald-400";
  }
  if (tone === "warn")
  {
    return "text-amber-400";
  }
  return "text-zinc-500";
}

function HealthChip(props: { label: string; tone: LabHealthTone; hint?: string }) {
  return (
    <span className={`text-xs ${chipClass(props.tone)}`} title={props.hint}>
      ● {props.label}
    </span>
  );
}

export function LabHealthStrip() {
  const { health, session } = useLabWorkbenchShell();

  const brokerTone: LabHealthTone = health.brokerUp ? "ok" : "off";
  const serialTone: LabHealthTone = health.serialOpen ? "ok" : health.brokerUp ? "warn" : "off";
  const bs2Tone: LabHealthTone = health.bs2Linked ? "ok" : health.brokerUp ? "warn" : "off";
  const loopTone: LabHealthTone = health.loopbackOn ? "ok" : "off";

  const showNextStepHint =
    session.isConnected && !health.serialOpen && !health.loopbackOn;

  const showWsHint = !session.isConnected;

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-zinc-800/80 px-3 py-1.5">
      <HealthChip label="Broker" tone={brokerTone} hint={session.connectionState} />
      <HealthChip
        label="Serial"
        tone={serialTone}
        hint={health.serialOpen ? "COM open" : "COM closed"}
      />
      <HealthChip
        label="BS2"
        tone={bs2Tone}
        hint={
          health.helloAgeMs != null ? `HELLO ${(health.helloAgeMs / 1000).toFixed(1)}s ago` : "no HELLO"
        }
      />
      <HealthChip label="Loopback" tone={loopTone} hint={health.loopbackOn ? "on" : "off"} />
      {showWsHint ? (
        <span className="text-[10px] text-zinc-500">
          Connect WebSocket — run <code className="text-zinc-400">npm run start:bridge</code> first
          (or <code className="text-zinc-400">dev:bitstream2-loopback</code> for simulator)
        </span>
      ) : null}
      {showNextStepHint ? (
        <span className="text-[10px] text-amber-300/90">
          Broker OK — Serial pane: List ports → Open COM @ 921600 (real MCU). Simulator:{" "}
          <code className="text-amber-200/80">npm run dev:bitstream2-loopback</code>
        </span>
      ) : null}
    </div>
  );
}
