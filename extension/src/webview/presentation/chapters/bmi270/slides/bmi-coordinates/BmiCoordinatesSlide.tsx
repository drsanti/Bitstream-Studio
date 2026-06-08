import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";
import { AxisTriadSvg } from "../../../_shared/visual/diagrams/AxisTriadSvg";
import { AxisTriad3DScene } from "../../../../widgets/r3f/AxisTriad3DScene";

export default function BmiCoordinatesSlide() {
  return (
    <TheorySlideLayout
      eyebrow="Foundations"
      title="Right-hand sensor frame"
      subtitle="Thumb +X · index +Y · middle +Z. Gravity appears as +1 g along the upward axis when level."
      layout="split-40-60"
      visualLabel="2D + 3D axes"
      visualAccent="cyan"
      visual={
        <div className="flex h-full min-h-[260px] flex-col">
          <div className="h-[48%] min-h-0 shrink-0">
            <AxisTriadSvg />
          </div>
          <div className="min-h-0 flex-1 border-t border-[var(--surface-border)]">
            <AxisTriad3DScene />
          </div>
        </div>
      }
    >
      <div className="overflow-hidden rounded-xl border border-[var(--surface-border)]">
        <table className="w-full max-w-xl text-sm">
          <thead className="bg-[var(--surface-card)] text-2xs uppercase tracking-wider text-[var(--text-muted)]">
            <tr>
              <th className="px-3 py-2 text-left">Pose</th>
              <th className="px-3 py-2 text-[var(--axis-x)]">aX</th>
              <th className="px-3 py-2 text-[var(--axis-y)]">aY</th>
              <th className="px-3 py-2 text-[var(--axis-z)]">aZ</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Flat on table", "≈ 0", "≈ 0", "≈ +1 g"],
              ["On side (X up)", "≈ +1 g", "≈ 0", "≈ 0"],
            ].map(([pose, ax, ay, az]) => (
              <tr key={pose} className="border-t border-[var(--surface-border)]">
                <td className="px-3 py-2 text-[var(--text-secondary)]">{pose}</td>
                <td className="px-3 py-2 text-center">{ax}</td>
                <td className="px-3 py-2 text-center">{ay}</td>
                <td className="px-3 py-2 text-center">{az}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TheorySlideLayout>
  );
}
