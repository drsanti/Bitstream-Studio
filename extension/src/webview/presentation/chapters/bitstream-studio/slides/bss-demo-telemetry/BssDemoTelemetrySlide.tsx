import { usePresentationSensorRows } from "../../../../app/usePresentationLive";
import { DemoSlideLayout } from "../../../_shared/layouts/DemoSlideLayout";

function formatAge(lastAtMs: number | null): string {
  if (lastAtMs == null) {
    return "—";
  }
  const ageSec = Math.max(0, Math.round((Date.now() - lastAtMs) / 1000));
  return ageSec < 2 ? "just now" : `${ageSec}s ago`;
}

export default function BssDemoTelemetrySlide() {
  const rows = usePresentationSensorRows();

  return (
    <DemoSlideLayout
      layout="stack"
      title="Multi-sensor last sample"
      subtitle="sensorId 0–3 · latest decode from useBitstreamLiveStore.latestByHint"
      theoryStrip="Each row is the most recent EVT_SENSOR decode for that sensor channel."
      footer="Publish masks in SENSOR_CFG control which fields appear in the summary column."
    >
      <div className="overflow-hidden rounded-xl border border-[var(--surface-border)]">
        <table className="w-full max-w-4xl text-left text-sm">
          <thead className="bg-[var(--surface-card)] text-2xs uppercase tracking-wider text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-2.5 font-semibold">ID</th>
              <th className="px-4 py-2.5 font-semibold">Sensor</th>
              <th className="px-4 py-2.5 font-semibold">Counter</th>
              <th className="px-4 py-2.5 font-semibold">Last values</th>
              <th className="px-4 py-2.5 font-semibold">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.hint} className="border-t border-[var(--surface-border)]">
                <td className="px-4 py-3 text-[var(--text-secondary)]">{row.sensorId}</td>
                <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">{row.name}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">
                  {row.counter ?? "—"}
                </td>
                <td
                  className="px-4 py-3"
                  style={{ color: row.hasSample ? "var(--text-primary)" : "var(--text-muted)" }}
                >
                  {row.summary}
                </td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{formatAge(row.lastAtMs)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DemoSlideLayout>
  );
}
