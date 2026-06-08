import { Activity } from "lucide-react";
import { usePresentationBmi270 } from "../../shared/live";
import { useCourseDisplayTween } from "../../motion/useCourseDisplayTween";

function MetricAxis({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const display = useCourseDisplayTween(value);

  return (
    <div className="rounded-lg border border-[var(--surface-border)] bg-[var(--surface-bg)] px-2 py-2 text-center">
      <div className="text-2xs uppercase tracking-wide text-[var(--text-muted)]">{label}</div>
      <div className="mt-1 text-sm font-semibold" style={{ color }}>
        {display.toFixed(4)}
      </div>
      <div className="text-2xs text-[var(--text-muted)]">g</div>
    </div>
  );
}

export function CourseLiveMetricCard({ title }: { title: string }) {
  const frame = usePresentationBmi270();
  const magnitude = useCourseDisplayTween(
    Math.sqrt(frame.ax ** 2 + frame.ay ** 2 + frame.az ** 2),
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] px-4 py-3">
      <div className="flex items-center gap-2">
        <Activity size={16} strokeWidth={2} style={{ color: "var(--axis-x)" }} />
        <span className="text-sm font-semibold text-[var(--text-primary)]">{title}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <MetricAxis label="aX" value={frame.ax} color="var(--axis-x)" />
        <MetricAxis label="aY" value={frame.ay} color="var(--axis-y)" />
        <MetricAxis label="aZ" value={frame.az} color="var(--axis-z)" />
      </div>
      <div className="text-2xs text-[var(--text-muted)]">|a| ≈ {magnitude.toFixed(4)} g</div>
    </div>
  );
}
