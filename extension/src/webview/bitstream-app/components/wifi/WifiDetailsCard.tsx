import { Bug, Clock } from "lucide-react";
import { TRNCard } from "../../../ui/TRN/TRNCard";
import type { BitstreamWifiRxMeta, BitstreamWifiStatusSource, BitstreamWifiTxMeta, BitstreamWifiSyncMeta } from "../../state/bitstreamWifi.store";
import { formatTs } from "./wifi-panel-utils";

function formatMsgId(meta: BitstreamWifiRxMeta): string {
  return `0x${meta.msgId.toString(16).padStart(2, "0")}`;
}

export function WifiDetailsCard(props: {
  capsWarning: string | null;
  statusSource: BitstreamWifiStatusSource | null;
  lastUpdatedAt: number | null;
  wifiSync: BitstreamWifiSyncMeta;
  lastTx: BitstreamWifiTxMeta | null;
  lastRx: BitstreamWifiRxMeta | null;
  forceSendWithoutCaps: boolean;
  onForceSendWithoutCapsChange: (next: boolean) => void;
}) {
  const { capsWarning, statusSource, lastUpdatedAt, wifiSync, lastTx, lastRx, forceSendWithoutCaps, onForceSendWithoutCapsChange } = props;

  return (
    <TRNCard
      title="Details"
      icon={<Bug className="h-4 w-4" />}
      mode="simple"
      collapsible
      defaultExpanded={false}
      glass
      glassPreset="medium"
      contentClassName="space-y-2 p-2"
    >
      {capsWarning ? (
        <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] leading-snug text-amber-200/90">
          {capsWarning}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 text-[10px]">
        <span className="inline-flex items-center gap-1 rounded-md border border-zinc-700/80 bg-zinc-900/60 px-2 py-0.5 text-zinc-300">
          <Clock className="h-3 w-3 text-zinc-400" />
          Updated: {formatTs(lastUpdatedAt)}
        </span>
        <span className="rounded-md border border-zinc-700/80 bg-zinc-900/60 px-2 py-0.5 text-zinc-400">
          Source: {statusSource ?? "—"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-300">
        <div className="rounded border border-zinc-700/70 bg-zinc-900/55 px-2 py-1">
          <span className="text-zinc-500">Wi‑Fi sync:</span>{" "}
          <span className="text-zinc-200">{wifiSync.state}</span>
          <div className="text-zinc-500">Attempt: {formatTs(wifiSync.lastAttemptAtMs)}</div>
          <div className="text-zinc-500">OK: {formatTs(wifiSync.lastOkAtMs)}</div>
        </div>
        <div className="rounded border border-zinc-700/70 bg-zinc-900/55 px-2 py-1">
          <span className="text-zinc-500">Last TX:</span>{" "}
          <span className="text-zinc-200">
            {lastTx ? `${lastTx.kind} (corr=${lastTx.corrId}) @ ${formatTs(lastTx.atMs)}` : "—"}
          </span>
          <div className="mt-1">
            <span className="text-zinc-500">Last RX:</span>{" "}
            <span className="text-zinc-200">
              {lastRx ? `msg=${formatMsgId(lastRx)} seq=${lastRx.seq} len=${lastRx.len} @ ${formatTs(lastRx.atMs)}` : "—"}
            </span>
          </div>
        </div>
      </div>

      {import.meta.env.DEV ? (
        <label className="flex items-center gap-2 rounded-md border border-zinc-700/70 bg-zinc-900/55 px-2 py-1 text-[11px] text-zinc-300">
          <input
            type="checkbox"
            checked={forceSendWithoutCaps}
            onChange={(e) => onForceSendWithoutCapsChange(e.target.checked)}
          />
          Force send Wi‑Fi commands even when CAPS is missing (dev)
        </label>
      ) : null}
    </TRNCard>
  );
}

