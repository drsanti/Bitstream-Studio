import { BS2_CMD } from "../domains/config/commands";
import { BS2_SENSOR_ID } from "../domains/sensors/sensor-ids";

export type SimScenarioStep =
  | { kind: "wait"; ms: number }
  | { kind: "ping" }
  | { kind: "cfgGet"; sensorId: number }
  | { kind: "expectHello"; withinMs: number }
  | { kind: "expectSamples"; minCount: number; sensorId?: number; withinMs: number };

export type SimScenario = {
  id: string;
  description: string;
  steps: SimScenarioStep[];
};

export const BS2_SIM_SCENARIOS: Record<string, SimScenario> = {
  boot: {
    id: "boot",
    description: "HELLO on boot + BMI270 stream samples",
    steps: [
      { kind: "expectHello", withinMs: 200 },
      { kind: "wait", ms: 80 },
      { kind: "expectSamples", minCount: 3, sensorId: BS2_SENSOR_ID.BMI270, withinMs: 500 },
    ],
  },
  full_board: {
    id: "full_board",
    description: "All four sensors streaming (board profile defaults)",
    steps: [
      { kind: "expectHello", withinMs: 200 },
      { kind: "wait", ms: 350 },
      { kind: "expectSamples", minCount: 2, sensorId: BS2_SENSOR_ID.BMI270, withinMs: 500 },
      { kind: "expectSamples", minCount: 1, sensorId: BS2_SENSOR_ID.BMM350, withinMs: 500 },
      { kind: "expectSamples", minCount: 1, sensorId: BS2_SENSOR_ID.SHT40, withinMs: 500 },
      { kind: "expectSamples", minCount: 1, sensorId: BS2_SENSOR_ID.DPS368, withinMs: 500 },
    ],
  },
  ping_cfg: {
    id: "ping_cfg",
    description: "PING + SENSOR_CFG_GET for BMI270",
    steps: [
      { kind: "ping" },
      { kind: "cfgGet", sensorId: BS2_SENSOR_ID.BMI270 },
      { kind: "wait", ms: 50 },
    ],
  },
};

export function listScenarioIds(): string[] {
  return Object.keys(BS2_SIM_SCENARIOS);
}

export function getScenario(id: string): SimScenario | null {
  return BS2_SIM_SCENARIOS[id] ?? null;
}

export function scenarioUsesCmd(step: SimScenarioStep): number | null {
  if (step.kind === "ping") return BS2_CMD.PING;
  if (step.kind === "cfgGet") return BS2_CMD.SENSOR_CFG_GET;
  return null;
}
