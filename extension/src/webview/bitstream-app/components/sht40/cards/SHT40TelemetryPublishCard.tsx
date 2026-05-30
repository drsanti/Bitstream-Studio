import { SensorTelemetryPublishCard } from "../../shared/SensorTelemetryPublishCard";
import type { Sht40AckState } from "../types";

export function SHT40TelemetryPublishCard(props: {
  collapsed: boolean;
  controlsDisabled: boolean;
  ack: Sht40AckState;
  publishIntervalMs: number;
  samplingIntervalMs: number;
  onToggleCollapsed: () => void;
  onPublishIntervalMsChange: (nextMs: number) => void;
}) {
  return <SensorTelemetryPublishCard {...props} />;
}
