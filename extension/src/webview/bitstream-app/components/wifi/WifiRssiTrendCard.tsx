import { Activity } from "lucide-react";
import { TRNCard } from "../../../ui/TRN/TRNCard";

export function WifiRssiTrendCard(props: { rssiHistory: number[] }) {
  const { rssiHistory } = props;

  return (
    <TRNCard
      title="RSSI trend"
      icon={<Activity className="h-4 w-4" />}
      mode="simple"
      collapsible={false}
      glass
      glassPreset="medium"
      contentClassName="space-y-2 p-2"
    >
      {rssiHistory.length > 0 ? (
        <div className="flex h-12 items-end gap-1 rounded border border-zinc-700/70 bg-zinc-900/55 px-2 py-1">
          {rssiHistory.map((rssi, idx) => {
            const normalized = Math.max(0, Math.min(1, (rssi + 100) / 70));
            const h = Math.max(10, Math.round(normalized * 40));
            const tone = rssi > -60 ? "bg-emerald-400/80" : rssi > -75 ? "bg-amber-400/80" : "bg-rose-400/80";
            return <span key={`${idx}-${rssi}`} className={`w-1.5 rounded-sm ${tone}`} style={{ height: `${h}px` }} />;
          })}
        </div>
      ) : (
        <p className="rounded border border-zinc-700/70 bg-zinc-900/55 px-2 py-1 text-[11px] text-zinc-500">
          No RSSI samples yet.
        </p>
      )}
    </TRNCard>
  );
}

