/*******************************************************************************
 * File Name        : WifiScanEmptyState.tsx
 *
 * Description      : Idle, timeout, and empty-complete copy for Nearby networks card.
 *
 * Author           : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version          : 1.0
 * Target           : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { Radio } from "lucide-react";
import type { WifiScanUiOutcome } from "./useWifiScanSession";
import { WIFI_SCAN_UI_TIMEOUT_MS } from "./wifi-panel-utils";

export function WifiScanEmptyState(props: {
  scanOutcome: WifiScanUiOutcome;
}) {
  const { scanOutcome } = props;
  const timeoutSec = Math.round(WIFI_SCAN_UI_TIMEOUT_MS / 1000);

  if (scanOutcome === "timeout") {
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-center" role="status">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800/50">
          <Radio className="h-7 w-7 text-zinc-500" aria-hidden />
        </div>
        <p className="text-xs font-medium text-zinc-200">No networks found</p>
        <p className="max-w-[20rem] text-[11px] leading-snug text-zinc-500">
          Scan timed out after {timeoutSec} seconds. The device did not report any access points.
          Check the UART link, then try Scan again.
        </p>
      </div>
    );
  }

  if (scanOutcome === "complete") {
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-center" role="status">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800/50">
          <Radio className="h-7 w-7 text-zinc-500" aria-hidden />
        </div>
        <p className="text-xs font-medium text-zinc-200">No networks found</p>
        <p className="max-w-[20rem] text-[11px] leading-snug text-zinc-500">
          The scan completed but no access points were reported. Try moving the board or scan
          again.
        </p>
      </div>
    );
  }

  return (
    <p className="px-0.5 text-[11px] text-zinc-500">
      No networks listed yet. Tap Scan for networks on the card above.
    </p>
  );
}
