import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";
import { DashboardGridSvg } from "../../../_shared/visual/diagrams/DashboardGridSvg";

const WIDGETS = [
  {
    name: "Gauge / Knob / Bar",
    role: "Scalar HMI — wire sensor taps or math nodes into radial gauges and knobs.",
    accent: "var(--accent-cyan)",
  },
  {
    name: "Plotter / Sparkline",
    role: "Trends — time-series from live numeric wires; follow-wire colors on the Dashboard pane.",
    accent: "var(--accent-purple)",
  },
  {
    name: "Tab / Group / Layout",
    role: "Multi-page operator panels — grid placement, nested groups, JSON export/import.",
    accent: "var(--accent-amber)",
  },
];

export default function BssStudioDashboardSlide() {
  return (
    <TheorySlideLayout
      eyebrow="Sensor Studio"
      title="Dashboard widgets"
      subtitle="Operator HMI layout — Flow nodes publish widgets evaluated on each telemetry tick."
      visualLabel="Dashboard grid"
      visualAccent="purple"
      visual={<DashboardGridSvg />}
      footer="Spec: extension/src/webview/sensor-studio/docs/DASHBOARD_VIEWPORT_AND_OUTPUT.md"
    >
      <div className="grid max-w-3xl grid-cols-1 gap-3 md:grid-cols-3">
        {WIDGETS.map(({ name, role, accent }) => (
          <div
            key={name}
            className="flex flex-col gap-2 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] p-4"
          >
            <div className="text-sm font-bold" style={{ color: accent }}>
              {name}
            </div>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{role}</p>
          </div>
        ))}
      </div>
      <p className="max-w-2xl text-sm text-[var(--text-secondary)]">
        Enable <span className="font-semibold text-[var(--text-primary)]">publishToDashboard</span> on Flow nodes
        (gauge, plotter, LED, …) — the Dashboard pane lays out published cells without a second decoder.
      </p>
    </TheorySlideLayout>
  );
}
