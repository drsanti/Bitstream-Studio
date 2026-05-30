import { SensorTelemetryPublishCard } from "../../shared/SensorTelemetryPublishCard";
import type { Dps368AckState } from "../types";

export function DPS368TelemetryPublishCard(props: {
  collapsed: boolean;
  controlsDisabled: boolean;
  ack: Dps368AckState;
  publishIntervalMs: number;
  samplingIntervalMs: number;
  onToggleCollapsed: () => void;
  onPublishIntervalMsChange: (nextMs: number) => void;
}) {
  return <SensorTelemetryPublishCard {...props} />;
}
