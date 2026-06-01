import { WorkspaceChromeBar } from "../bitstream-shell/ui/WorkspaceChromeBar";
import {
  TelemetryToolbarActions,
  type TelemetryToolbarActionsProps,
} from "./TelemetryToolbarActions";

export type SensorTelemetryChromeBarProps = TelemetryToolbarActionsProps & {
  borderColor?: string;
};

/**
 * Merged Sensor Telemetry header (replaces separate shell lifecycle bar in telemetry mode).
 */
export function SensorTelemetryChromeBar(props: SensorTelemetryChromeBarProps) {
  const { borderColor, ...actionsProps } = props;

  return (
    <WorkspaceChromeBar
      title="Sensor Telemetry"
      borderColor={borderColor}
      actions={<TelemetryToolbarActions {...actionsProps} />}
    />
  );
}
