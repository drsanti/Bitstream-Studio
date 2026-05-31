/*******************************************************************************
 * Node Inspector Device tab — editable shared device SENSOR_CFG deck + apply bar.
 ******************************************************************************/

import { useBitstreamTransportActionsOptional } from "../../../bitstream-app/context/bitstreamTransportActions.context.js";
import { useSensorCfgPanelHost } from "../../lib/sensorCfgPanelHost.js";
import { useConfigPaneDirtySourceIds } from "../../lib/configPaneDirty.js";
import { SensorCfgApplyBar } from "../panels/SensorCfgApplyBar.js";
import { sensorCfgApplyBarAck } from "../../lib/sensorCfgApplyBarAck.js";
import { SensorCfgDeck } from "./SensorCfgDeck.js";

export type InspectorSensorCfgSectionProps = {
  sourceId: number;
};

export function InspectorSensorCfgSection(props: InspectorSensorCfgSectionProps) {
  const { sourceId } = props;

  const transportActions = useBitstreamTransportActionsOptional();

  const host = useSensorCfgPanelHost({ focusSourceId: sourceId });

  const dirtySourceIds = useConfigPaneDirtySourceIds();
  const scopedDirty = dirtySourceIds.includes(sourceId);

  const applyAck = sensorCfgApplyBarAck(host.sensorConfigAck);

  if (transportActions == null) {
    return (
      <div className="space-y-2 rounded-md border border-rose-800/50 bg-rose-950/20 px-2 py-2 text-[11px] leading-relaxed text-rose-100/90">
        <div className="font-semibold text-rose-100">Device controls unavailable</div>
        <p>
          Run Sensor Studio inside Bitstream (
          <span className="font-mono text-[10px]">?app=sensor-studio</span>) so firmware commands
          are wired.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col gap-2">
      {host.lockReason != null ? (
        <p className="text-[10px] leading-snug text-zinc-500">{host.lockReason.message}</p>
      ) : null}

      <div
        className={
          host.canControl
            ? "min-h-0"
            : "pointer-events-none min-h-0 opacity-50"
        }
      >
        <SensorCfgDeck sourceId={sourceId} host={host} draftUntilApply />
      </div>

      <SensorCfgApplyBar
        canControl={host.canControl}
        busy={host.busy}
        onRefresh={host.onRefresh}
        onRevert={() => host.onRevertSource(sourceId)}
        onApply={() => host.onApplySource(sourceId)}
        applyAck={applyAck}
        scopeSourceId={sourceId}
        scopeDirty={scopedDirty}
      />
    </div>
  );
}
