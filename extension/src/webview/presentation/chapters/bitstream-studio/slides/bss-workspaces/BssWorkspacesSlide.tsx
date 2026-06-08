import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";

const WORKSPACES = [
  {
    name: "Sensor Telemetry",
    role: "Configure sensors, inspect live BS2 samples, and manage UART vs Simulator routes.",
    accent: "var(--accent-cyan)",
  },
  {
    name: "Sensor Studio",
    role: "Build flows, Stage scenes, and Dashboards that react to the same live store.",
    accent: "var(--accent-purple)",
  },
  {
    name: "Presentation",
    role: "Instructor slides with theory, live demos, and labs — no duplicate decoder.",
    accent: "var(--accent-amber)",
  },
];

export default function BssWorkspacesSlide() {
  return (
    <TheorySlideLayout
      eyebrow="Platform"
      title="Three workspaces, one broker"
      subtitle="Each tab is a different lens on the same Bitstream Studio runtime."
    >
      <div className="grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-3">
        {WORKSPACES.map(({ name, role, accent }) => (
          <div
            key={name}
            className="flex flex-col gap-2 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] p-5"
          >
            <div className="text-sm font-bold text-[var(--text-primary)]" style={{ color: accent }}>
              {name}
            </div>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{role}</p>
          </div>
        ))}
      </div>
    </TheorySlideLayout>
  );
}
