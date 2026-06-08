import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";

const MODES = [
  {
    name: "Hardware (Bitstream)",
    detail: "Real UART on COM @ 921600. Samples tagged origin uart. Simulator inject blocked.",
    accent: "var(--accent-cyan)",
  },
  {
    name: "Simulator",
    detail: "External bitstream-simulator VSIX streams into the same broker. origin sim. No COM open.",
    accent: "var(--accent-purple)",
  },
];

export default function BssTelemetryModesSlide() {
  return (
    <TheorySlideLayout
      eyebrow="Telemetry modes"
      title="Bitstream and Simulator are mutually exclusive"
      subtitle="Switching modes clears mixed data and publishes a new telemetry route."
    >
      <div className="grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-2">
        {MODES.map(({ name, detail, accent }) => (
          <div
            key={name}
            className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] p-5"
          >
            <div className="text-sm font-bold" style={{ color: accent }}>
              {name}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{detail}</p>
          </div>
        ))}
      </div>
      <p className="max-w-2xl text-2xs text-[var(--text-muted)]">
        Lifecycle: `extension/docs/TELEMETRY_MODE_LIFECYCLE.md` · route topic{" "}
        <span className="text-[var(--text-secondary)]">bitstream2/telemetry/route</span>
      </p>
    </TheorySlideLayout>
  );
}
