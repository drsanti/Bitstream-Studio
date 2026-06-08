import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";

const ROWS = [
  { topic: "Human readability", euler: "Excellent — degrees on dashboards", quat: "Opaque without training" },
  { topic: "3D graphics", euler: "Gimbal lock risk", quat: "Smooth interpolation (slerp)" },
  { topic: "Singularities", euler: "At extreme pitch", quat: "None (unit sphere)" },
  { topic: "BS2 publish", euler: "Mask 0x08", quat: "Mask 0x10" },
];

export default function EqEulerVsQuaternionSlide() {
  return (
    <TheorySlideLayout eyebrow="Comparison" title="Euler vs quaternion" subtitle="Use both — each has a teaching and engineering role.">
      <div className="overflow-hidden rounded-xl border border-[var(--surface-border)]">
        <table className="w-full max-w-4xl text-sm">
          <thead className="bg-[var(--surface-card)] text-2xs uppercase tracking-wider text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-2 text-left">Topic</th>
              <th className="px-4 py-2 text-left" style={{ color: "var(--accent-amber)" }}>
                Euler
              </th>
              <th className="px-4 py-2 text-left" style={{ color: "var(--accent-purple)" }}>
                Quaternion
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.topic} className="border-t border-[var(--surface-border)]">
                <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">{row.topic}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{row.euler}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{row.quat}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TheorySlideLayout>
  );
}
