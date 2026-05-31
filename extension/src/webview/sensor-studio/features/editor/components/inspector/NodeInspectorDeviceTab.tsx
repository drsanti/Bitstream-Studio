import { getSensorSourceDisplayLabel } from "../../../../../bitstream-app/constants/sensorSourceIds";
import { InspectorSensorCfgSection } from "../../../../../sensor-telemetry/components/sensor-cfg-deck/InspectorSensorCfgSection";

export type NodeInspectorDeviceTabProps = {
  sourceId: number;
};

/**
 * Firmware-facing SENSOR_CFG controls — shared across all clients on this MCU.
 */
export function NodeInspectorDeviceTab(props: NodeInspectorDeviceTabProps) {
  const { sourceId } = props;
  const sensorLabel = getSensorSourceDisplayLabel(sourceId);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden text-xs">
      <div className="shrink-0 rounded-md border border-amber-900/35 bg-amber-950/20 px-2 py-1.5 text-[10px] leading-snug text-amber-100/90">
        <span className="font-semibold text-amber-50/95">Shared device settings.</span>{" "}
        Changes apply to{" "}
        <span className="font-mono text-[10px] text-amber-50/90">{sensorLabel}</span> on the
        MCU for every client — not only this flow node. Same controls appear in Telemetry →
        Sensor Config.
      </div>
      <InspectorSensorCfgSection sourceId={sourceId} />
    </div>
  );
}
