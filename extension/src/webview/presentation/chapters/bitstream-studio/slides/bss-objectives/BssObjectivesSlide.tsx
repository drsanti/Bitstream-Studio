import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";

const OBJECTIVES = [
  "Name the Sensor Telemetry and Sensor Studio workspaces",
  "Explain Bitstream vs Simulator telemetry modes",
  "Trace data from MCU → bridge → live store → slides",
  "Use presentation alongside telemetry for instructor-led demos",
];

export default function BssObjectivesSlide() {
  return (
    <TheorySlideLayout eyebrow="Learning objectives" title="Platform chapter">
      <ul className="flex max-w-2xl flex-col gap-4">
        {OBJECTIVES.map((item) => (
          <li
            key={item}
            className="flex items-start gap-3 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-card)] px-4 py-3 text-[var(--text-secondary)]"
          >
            <span
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
              style={{ background: "var(--accent-cyan)" }}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </TheorySlideLayout>
  );
}
