/*******************************************************************************
 * File Name        : WifiScanResultsCard.tsx
 *
 * Description      : List of scanned access points for the Wi‑Fi panel.
 *
 * Author           : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version          : 1.3
 * Target           : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useMemo } from "react";
import type { BitstreamWifiScanRow } from "../../../../bitstream2/domains/wifi/store-types";
import type { WifiScanUiOutcome } from "./useWifiScanSession";
import { formatWifiBssid } from "./wifi-panel-utils";
import { WifiScanEmptyState } from "./WifiScanEmptyState";
import { WifiScanProgressIndicator } from "./WifiScanProgressIndicator";
import { WifiScanResultRow } from "./WifiScanResultRow";
import { WifiScanSkeletonList } from "./WifiScanSkeletonList";

function sortScanRowsByRssi(rows: BitstreamWifiScanRow[]): BitstreamWifiScanRow[] {
  return rows.slice().sort((a, b) => b.rssi - a.rssi);
}

export function WifiScanResultsCard(props: {
  isScanActive: boolean;
  scanOutcome: WifiScanUiOutcome;
  scanRows: BitstreamWifiScanRow[];
  lastScanTotalCount: number | null;
  onPickSsid: (ssid: string) => void;
}) {
  const { isScanActive, scanOutcome, scanRows, lastScanTotalCount, onPickSsid } = props;

  const sortedRows = useMemo(() => sortScanRowsByRssi(scanRows), [scanRows]);
  const hasRows = sortedRows.length > 0;
  const strongestRssi = hasRows ? sortedRows[0].rssi : -127;

  if (isScanActive && !hasRows) {
    return (
      <div className="space-y-2">
        <WifiScanProgressIndicator
          size="hero"
          title="Searching for Wi‑Fi networks"
          subtitle="Results will show up here as they are found."
        />
        <WifiScanSkeletonList rowCount={3} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {isScanActive && hasRows ? (
        <p className="text-[11px] text-sky-200/85">
          Found {sortedRows.length} so far…
        </p>
      ) : null}
      {!isScanActive && lastScanTotalCount != null && scanOutcome === "complete" ? (
        <p className="text-[11px] text-zinc-400">
          Found {lastScanTotalCount} network{lastScanTotalCount === 1 ? "" : "s"}.
          {hasRows ? " Sorted by signal strength." : ""}
        </p>
      ) : null}
      {hasRows ? (
        <ul className="scrollbar-hide max-h-52 overflow-y-auto rounded-md bg-zinc-900/40 p-2">
          {sortedRows.map((row) => (
            <WifiScanResultRow
              key={`${row.index}-${row.ssid}-${formatWifiBssid(row.bssid)}`}
              row={row}
              isStrongest={row.rssi === strongestRssi && row.rssi > -127}
              onPickSsid={onPickSsid}
            />
          ))}
        </ul>
      ) : null}
      {isScanActive && hasRows ? (
        <WifiScanSkeletonList rowCount={1} />
      ) : null}
      {!isScanActive && !hasRows ? (
        <WifiScanEmptyState scanOutcome={scanOutcome} />
      ) : null}
    </div>
  );
}
