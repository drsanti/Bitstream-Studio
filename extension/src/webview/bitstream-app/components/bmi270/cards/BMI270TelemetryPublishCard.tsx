import { SensorTelemetryPublishCard } from "../../shared/SensorTelemetryPublishCard";
import type { Bmi270AckState } from "../types";

export function BMI270TelemetryPublishCard(props: {
  collapsed: boolean;
  controlsDisabled: boolean;
  ack: Bmi270AckState;
  publishIntervalMs: number;
  samplingIntervalMs: number;
  onToggleCollapsed: () => void;
  onPublishIntervalMsChange: (nextMs: number) => void;
}) {
  return <SensorTelemetryPublishCard {...props} />;
}
