/*******************************************************************************
 * File Name        : WifiActivityLogRow.tsx
 *
 * Description      : One structured row in the Wi‑Fi Activity log.
 *
 * Author           : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version          : 1.0
 * Target           : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { formatEventTime } from "./wifi-panel-utils";
import { wifiActivityBadgeClass, type WifiActivityEvent } from "./wifi-activity-events";

export function WifiActivityLogRow(props: { event: WifiActivityEvent }) {
  const { event } = props;

  return (
    <li className="grid grid-cols-[4.75rem_minmax(5.5rem,auto)_1fr_auto] items-center gap-x-2 gap-y-0.5 border-b border-zinc-800/50 py-1.5 last:border-0 last:pb-0">
      <span className="shrink-0 tabular-nums text-[10px] text-zinc-500">
        {formatEventTime(event.at)}
      </span>
      <span
        className={`inline-flex max-w-[6.5rem] shrink-0 items-center justify-center rounded-full border px-2 py-0.5 text-[10px] font-medium leading-none ${wifiActivityBadgeClass(event.tone)}`}
      >
        <span className="truncate">{event.badge}</span>
      </span>
      <span className="min-w-0 truncate text-[11px] font-medium text-zinc-100" title={event.primary}>
        {event.primary}
      </span>
      {event.meta != null && event.meta.length > 0 ? (
        <span className="shrink-0 tabular-nums text-[10px] text-zinc-400">{event.meta}</span>
      ) : (
        <span className="shrink-0" aria-hidden />
      )}
    </li>
  );
}
