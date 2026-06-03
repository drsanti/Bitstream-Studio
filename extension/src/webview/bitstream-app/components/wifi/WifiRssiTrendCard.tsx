/*******************************************************************************
 * File Name        : WifiRssiTrendCard.tsx
 *
 * Description      : Mini RSSI bar chart for the Wi‑Fi Status tab.
 *
 * Author           : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version          : 1.0
 * Target           : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

export function WifiRssiTrendCard(props: { rssiHistory: number[] }) {
  const { rssiHistory } = props;

  return (
    <div className="space-y-2">
      {rssiHistory.length > 0 ? (
        <div className="flex h-12 items-end gap-1 rounded-md bg-zinc-900/40 px-2 py-1">
          {rssiHistory.map((rssi, idx) => {
            const normalized = Math.max(0, Math.min(1, (rssi + 100) / 70));
            const h = Math.max(10, Math.round(normalized * 40));
            const tone =
              rssi > -60 ? "bg-emerald-400/80" : rssi > -75 ? "bg-amber-400/80" : "bg-rose-400/80";
            return (
              <span
                key={`${idx}-${rssi}`}
                className={`w-1.5 rounded-sm ${tone}`}
                style={{ height: `${h}px` }}
              />
            );
          })}
        </div>
      ) : (
        <p className="px-0.5 text-[11px] text-zinc-500">No signal samples yet. Refresh status on the Connection card.</p>
      )}
    </div>
  );
}
