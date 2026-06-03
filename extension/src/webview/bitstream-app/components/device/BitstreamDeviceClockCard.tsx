/*******************************************************************************
 * File Name        : BitstreamDeviceClockCard.tsx
 *
 * Description      : BS2 device wall clock (TIME_GET / TIME_SET / TIME_SYNC).
 *
 * Author           : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version          : 1.0
 * Target           : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { Clock } from "lucide-react";
import React from "react";
import { TRNButton } from "@/ui/TRN";
import {
  BS2_RTC_FLAG_NET_SYNC_AVAILABLE,
  BS2_RTC_FLAG_VALID,
} from "../../../../bitstream2/domains/time/commands";
import { useBitstreamAppControl } from "../../BitstreamAppWrapper";
import { isRtcStatusValid, useBitstreamRtcStore } from "../../state/bitstreamRtc.store";

function formatUnixLocal(unixSec: number): string {
  if (unixSec <= 0)
  {
    return "—";
  }
  return new Date(unixSec * 1000).toLocaleString();
}

export function BitstreamDeviceClockCard(props: { disabled?: boolean }) {
  const { rtcGet, rtcSetFromHost, rtcSyncNtp } = useBitstreamAppControl();
  const status = useBitstreamRtcStore((s) => s.lastStatus);
  const [busy, setBusy] = React.useState(false);

  const valid = isRtcStatusValid(status);
  const netAvail = status !== null && (status.flags & BS2_RTC_FLAG_NET_SYNC_AVAILABLE) !== 0;

  const run = async (fn: () => Promise<boolean>) => {
    setBusy(true);
    try
    {
      await fn();
    }
    finally
    {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-zinc-700/80 bg-zinc-900/60 p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-100">
        <Clock className="h-4 w-4 text-sky-300" aria-hidden />
        Device clock
      </div>
      <p className="mb-3 text-xs text-zinc-400">
        {valid
          ? `RTC: ${formatUnixLocal(status!.unixSec)} (source ${status!.source})`
          : "RTC not valid — set from host or wait for NTP (Phase 2)."}
        {netAvail ? " · Online sync available when Wi‑Fi is up." : ""}
      </p>
      <div className="flex flex-wrap gap-2">
        <TRNButton
          size="sm"
          variant="secondary"
          disabled={props.disabled || busy}
          onClick={() => void run(rtcGet)}
        >
          Refresh
        </TRNButton>
        <TRNButton
          size="sm"
          variant="primary"
          disabled={props.disabled || busy}
          onClick={() => void run(() => rtcSetFromHost())}
        >
          Set from PC
        </TRNButton>
        <TRNButton
          size="sm"
          variant="secondary"
          disabled={props.disabled || busy || !netAvail}
          onClick={() => void run(rtcSyncNtp)}
        >
          NTP sync
        </TRNButton>
      </div>
    </div>
  );
}
