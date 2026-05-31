/*******************************************************************************
 * File Name : SensorCfgApplyBar.tsx
 *
 * Description : Shared Refresh / Revert / Apply bar for sensor configuration pane.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.3
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { Download, Undo2, Upload } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { TRNButton } from "../../../ui/TRN";
import { getSensorSourceDisplayLabel } from "../../../bitstream-app/constants/sensorSourceIds.js";
import { useBitstreamDeviceSensorConfigStore } from "../../../bitstream-app/state/bitstreamDeviceSensorConfig.store.js";
import { useConfigPaneDirtySourceIds } from "../../lib/configPaneDirty.js";

import type { SensorConfigAckState } from "../../../bitstream-app/types/sensorConfigAck.js";
import { SensorCfgApplySuccessDialog } from "./SensorCfgApplySuccessDialog.js";
import "./SensorCfgApplyBar.css";

export function SensorCfgApplyBar(props: {
  canControl: boolean;
  busy: boolean;
  onRefresh: () => void;
  onRevert: () => void;
  onApply: () => void;
  applyAck?: SensorConfigAckState;
  /** When set, dirty count reflects this sensor only (embedded Inspector deck). */
  scopeSourceId?: number;
  scopeDirty?: boolean;
})
{
  const {
    canControl,
    busy,
    onRefresh,
    onRevert,
    onApply,
    applyAck,
    scopeSourceId,
    scopeDirty,
  } = props;
  const dirtyIds = useConfigPaneDirtySourceIds();
  const truthReady = useBitstreamDeviceSensorConfigStore((s) => s.sensorCfgTruthReady);
  const dirtyCount =
    scopeDirty != null
      ? scopeDirty
        ? 1
        : 0
      : dirtyIds.length;

  const pendingLabel =
    applyAck?.state === "pending" && applyAck.sourceId != null
      ? getSensorSourceDisplayLabel(applyAck.sourceId)
      : scopeSourceId != null
        ? getSensorSourceDisplayLabel(scopeSourceId)
        : null;

  const refreshDisabled = busy;
  const controlsLocked = !canControl || busy;
  const revertEnabled = !controlsLocked && dirtyCount > 0;
  const applyEnabled = !controlsLocked && dirtyCount > 0;

  const actionIconClass = "h-3 w-3 shrink-0";
  const actionIconStroke = 2.75;

  return (
    <>
      <SensorCfgApplySuccessDialog open={applyAck?.state === "ok"} />
      <div className="mt-auto shrink-0 space-y-1 border-t border-zinc-800 bg-black/30 px-2 py-2">
        <div className="grid w-full grid-cols-3 gap-2">
        <TRNButton
          size="compact"
          disabled={refreshDisabled}
          prefixIcon={
            <Download className={actionIconClass} strokeWidth={actionIconStroke} aria-hidden />
          }
          className="w-full min-w-0 gap-1 overflow-hidden border-zinc-600/80 bg-zinc-800/80 shadow-[0_2px_8px_rgba(0,0,0,0.35)] hover:bg-zinc-700/80"
          onClick={onRefresh}
        >
          <span className="truncate">Refresh</span>
        </TRNButton>
        <TRNButton
          size="compact"
          disabled={!revertEnabled}
          prefixIcon={
            <Undo2 className={actionIconClass} strokeWidth={actionIconStroke} aria-hidden />
          }
          className={twMerge(
            "w-full min-w-0 gap-1 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.35)]",
            revertEnabled
              ? "border-amber-500/50 bg-amber-950/70 text-amber-100 hover:bg-amber-900/70"
              : "border-zinc-700/80 bg-zinc-900/50 text-zinc-500",
          )}
          onClick={onRevert}
        >
          <span className="truncate">Revert</span>
        </TRNButton>
        <TRNButton
          size="compact"
          disabled={!applyEnabled}
          prefixIcon={
            <Upload className={actionIconClass} strokeWidth={actionIconStroke} aria-hidden />
          }
          className={twMerge(
            "w-full min-w-0 gap-1 overflow-hidden",
            applyEnabled
              ? "sensor-cfg-apply-pulse hover:bg-transparent"
              : "border-zinc-700/80 bg-zinc-900/50 text-zinc-500 shadow-[0_2px_10px_rgba(0,0,0,0.4)]",
          )}
          onClick={onApply}
        >
          <span className="truncate">Apply{dirtyCount > 0 ? ` (${dirtyCount})` : ""}</span>
        </TRNButton>
        </div>
        {!truthReady ? (
          <p className="text-[10px] text-zinc-500">Loading config from board…</p>
        ) : null}
        {applyAck?.state === "pending" ? (
          <p className="text-[10px] text-cyan-300/90">
            Applying{pendingLabel != null ? ` ${pendingLabel}` : " sensor config"}…
          </p>
        ) : null}
        {applyAck?.state === "error" ? (
          <p className="text-[10px] text-rose-300/90">{applyAck.message ?? "Apply failed"}</p>
        ) : null}
      </div>
    </>
  );
}
