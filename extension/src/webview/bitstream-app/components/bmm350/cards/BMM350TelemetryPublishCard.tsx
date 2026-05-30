import { SensorTelemetryPublishCard } from "../../shared/SensorTelemetryPublishCard";
import type { Bmm350AckState } from "../types";

export function BMM350TelemetryPublishCard(props: {
  collapsed: boolean;
  controlsDisabled: boolean;
  ack: Bmm350AckState;
  publishIntervalMs: number;
  samplingIntervalMs: number;
  onToggleCollapsed: () => void;
  onPublishIntervalMsChange: (nextMs: number) => void;
}) {
  return <SensorTelemetryPublishCard {...props} />;
}
