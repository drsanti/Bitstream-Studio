/*******************************************************************************
 * File Name        : WifiScanResultRow.tsx
 *
 * Description      : One network row in the Nearby networks list (Activity-style grid).
 *
 * Author           : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version          : 1.0
 * Target           : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import type { BitstreamWifiScanRow } from "../../../../bitstream2/domains/wifi/store-types";
import { formatWifiRssi, rssiToneClass } from "./wifi-panel-utils";

const CHANNEL_BADGE_CLASS =
  "border-violet-500/35 bg-violet-500/15 text-violet-200";

/** Fixed column widths so Ch 1 / Ch 40 / dBm / Use align across rows. */
const ROW_GRID_CLASS =
  "grid grid-cols-[3.25rem_minmax(0,1fr)_4.25rem_2.5rem] items-center gap-x-2";

export function WifiScanResultRow(props: {
  row: BitstreamWifiScanRow;
  isStrongest?: boolean;
  onPickSsid: (ssid: string) => void;
}) {
  const { row, isStrongest = false, onPickSsid } = props;
  const displayName = row.ssid.trim().length > 0 ? row.ssid : "(Hidden network)";
  const isHidden = row.ssid.trim().length === 0;
  const rssiText = formatWifiRssi(row.rssi);

  const pick = () => {
    onPickSsid(row.ssid);
  };

  return (
    <li
      className={`${ROW_GRID_CLASS} border-b border-zinc-800/50 py-1.5 last:border-0 last:pb-0 ${
        isStrongest ? "bg-emerald-500/6" : ""
      }`}
    >
      <span
        className={`inline-flex h-5 w-13 shrink-0 items-center justify-center rounded-full border px-0 text-[10px] font-medium leading-none tabular-nums ${CHANNEL_BADGE_CLASS}`}
        title={`Channel ${row.channel}`}
      >
        Ch {row.channel}
      </span>

      <button
        type="button"
        className={`min-w-0 truncate text-left text-[11px] font-medium hover:underline ${
          isHidden ? "italic text-zinc-400" : "text-zinc-100"
        }`}
        onClick={pick}
        title="Use this network on Connect tab"
      >
        {displayName}
      </button>

      <span
        className={`w-17 shrink-0 text-right text-[10px] font-medium tabular-nums ${rssiToneClass(row.rssi)}`}
      >
        {rssiText}
      </span>

      <button
        type="button"
        className="inline-flex h-5 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-600/70 bg-zinc-800/60 text-[10px] font-medium text-zinc-200 hover:bg-zinc-700/80"
        onClick={pick}
        title="Use on Connect tab"
      >
        Use
      </button>
    </li>
  );
}
