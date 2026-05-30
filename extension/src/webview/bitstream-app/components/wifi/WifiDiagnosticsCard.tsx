import { Activity } from "lucide-react";
import { TRNCard } from "../../../ui/TRN/TRNCard";
import { formatEventTime } from "./wifi-panel-utils";

type WifiTimelineEvent = {
  at: number;
  text: string;
};

export function WifiDiagnosticsCard(props: {
  recentEvents: WifiTimelineEvent[];
}) {
  const { recentEvents } = props;

  return (
    <TRNCard
      title="Diagnostics"
      icon={<Activity className="h-4 w-4" />}
      mode="simple"
      collapsible
      defaultExpanded={false}
      glass
      glassPreset="medium"
      contentClassName="space-y-2 p-2"
    >
      <div>
        <p className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500">Recent events</p>
        {recentEvents.length > 0 ? (
          <ul className="space-y-1 rounded border border-zinc-700/70 bg-zinc-900/55 p-2 text-[11px] text-zinc-300">
            {recentEvents.map((evt, idx) => (
              <li key={`${evt.at}-${idx}`} className="flex items-start gap-2">
                <span className="text-zinc-500">{formatEventTime(evt.at)}</span>
                <span className="text-zinc-300">{evt.text}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded border border-zinc-700/70 bg-zinc-900/55 px-2 py-1 text-[11px] text-zinc-500">No events recorded yet.</p>
        )}
      </div>
    </TRNCard>
  );
}
