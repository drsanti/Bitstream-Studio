import type { GlbAnimationLabPlaybackMode } from "./glb-animation-lab.types.js";
import type {
  AnimationLabDigitalTwinDef,
  AnimationLabTwinComponentLive,
  AnimationLabTwinHealth,
  AnimationLabTwinMachineSummary,
  AnimationLabTwinSignalLive,
} from "./digital-twin.types.js";
import {
  evaluateTwinSignalHealth,
  worstTwinHealth,
} from "./animation-lab-twin-health.js";

export type AnimationLabTwinSimulatorInput = {
  twin: AnimationLabDigitalTwinDef;
  nowMs: number;
  playbackMode: GlbAnimationLabPlaybackMode;
  activeClipName: string | null;
  transport: "stopped" | "playing" | "paused";
  /** Demo fault on first motor-like component after ~45s. */
  demoFaultEnabled?: boolean;
};

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function simulateSignalValue(args: {
  key: string;
  componentId: string;
  nowMs: number;
  stressed: boolean;
  injectFault: boolean;
}): number {
  const t = args.nowMs / 1000;
  const phase = (hashString(args.componentId) % 360) * (Math.PI / 180);
  const base = 0.55 + 0.45 * Math.sin(t * 0.35 + phase);
  const key = args.key.toLowerCase();

  if (key.includes("temp")) {
    const idle = 38 + base * 8;
    return args.stressed ? idle + 18 + Math.sin(t * 2.1) * 4 : idle;
  }
  if (key.includes("current")) {
    const idle = 2.2 + base * 1.8;
    return args.stressed ? idle + 4.5 + Math.sin(t * 3.2) * 1.2 : idle;
  }
  if (key.includes("vibration")) {
    const idle = 1.2 + base * 1.4;
    return args.stressed ? idle + 2.8 + Math.sin(t * 4) * 0.6 : idle;
  }
  if (key.includes("load")) {
    return args.stressed ? 55 + base * 35 : 18 + base * 22;
  }
  if (key.includes("track")) {
    return args.stressed ? 0.4 + base * 1.4 : 0.05 + base * 0.35;
  }
  if (key.includes("stabilizer")) {
    return args.stressed ? 48 + base * 28 : 15 + base * 18;
  }
  if (key.includes("link") || key.includes("dbm")) {
    return -62 - base * 12 - (args.stressed ? 8 : 0);
  }
  return 10 + base * 20;
}

function isComponentStressed(
  glbAnchor: string | undefined,
  activeClipName: string | null,
  transport: AnimationLabTwinSimulatorInput["transport"],
): boolean {
  if (transport !== "playing" || glbAnchor == null || activeClipName == null) {
    return false;
  }
  return (
    activeClipName === glbAnchor ||
    activeClipName.toLowerCase() === glbAnchor.toLowerCase()
  );
}

export function runAnimationLabTwinSimulator(
  input: AnimationLabTwinSimulatorInput,
): {
  components: AnimationLabTwinComponentLive[];
  summary: AnimationLabTwinMachineSummary;
} {
  const { twin, nowMs, playbackMode, activeClipName, transport, demoFaultEnabled = true } =
    input;
  const tSec = nowMs / 1000;
  const faultMotorId =
    twin.components.find((c) => c.group === "Propulsion")?.id ?? twin.components[0]?.id;
  const injectFault =
    demoFaultEnabled && faultMotorId != null && tSec > 45 && tSec % 90 < 25;

  const components: AnimationLabTwinComponentLive[] = twin.components.map((component) => {
    const stressed =
      playbackMode === "parallel-all" ||
      isComponentStressed(component.glbAnchor, activeClipName, transport);
    const componentFault = injectFault && component.id === faultMotorId;

    const signals: AnimationLabTwinSignalLive[] = component.signals.map((def) => {
      let value = simulateSignalValue({
        key: def.key,
        componentId: component.id,
        nowMs,
        stressed,
        injectFault: componentFault,
      });
      if (componentFault && def.key.includes("temp")) {
        value = Math.max(value, (def.alarm ?? 78) + 2);
      }
      if (componentFault && def.key.includes("current")) {
        value = Math.max(value, (def.alarm ?? 9) + 0.5);
      }
      const health = evaluateTwinSignalHealth(value, def);
      return {
        key: def.key,
        value,
        health,
        label: def.label,
        unit: def.unit,
      };
    });

    let health: AnimationLabTwinHealth = "ok";
    for (const s of signals) {
      health = worstTwinHealth(health, s.health);
    }
    return {
      id: component.id,
      label: component.label,
      group: component.group,
      glbAnchor: component.glbAnchor,
      health,
      signals,
    };
  });

  let summaryHealth: AnimationLabTwinHealth = "ok";
  let activeAlertCount = 0;
  for (const c of components) {
    summaryHealth = worstTwinHealth(summaryHealth, c.health);
    if (c.health === "warning" || c.health === "error") {
      activeAlertCount += 1;
    }
  }

  const summaryLabel =
    summaryHealth === "ok"
      ? "Operational"
      : summaryHealth === "caution"
        ? "Nominal — watch list"
        : summaryHealth === "warning"
          ? "Degraded"
          : summaryHealth === "error"
            ? "Fault — inspect now"
            : "Offline";

  return {
    components,
    summary: {
      health: summaryHealth,
      label: summaryLabel,
      activeAlertCount,
      updatedAtMs: nowMs,
    },
  };
}
