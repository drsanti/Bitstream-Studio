/*******************************************************************************
 * File Name        : WifiDiagnosticsCard.tsx
 *
 * Description      : Recent Wi‑Fi activity log for the Activity tab.
 *
 * Author           : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version          : 1.2
 * Target           : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { WifiActivityLogRow } from "./WifiActivityLogRow";
import type { WifiActivityEvent } from "./wifi-activity-events";

export function WifiDiagnosticsCard(props: { recentEvents: WifiActivityEvent[] }) {
  const { recentEvents } = props;

  return (
    <div className="space-y-2">
      <p className="text-[10px] text-zinc-500">Recent steps while this panel is open.</p>
      {recentEvents.length > 0 ? (
        <ul className="scrollbar-hide max-h-56 overflow-y-auto rounded-md bg-zinc-900/40 p-2">
          {recentEvents.map((evt, idx) => (
            <WifiActivityLogRow key={`${evt.at}-${evt.badge}-${evt.primary}-${idx}`} event={evt} />
          ))}
        </ul>
      ) : (
        <p className="px-0.5 text-[11px] text-zinc-500">No activity yet.</p>
      )}
    </div>
  );
}
