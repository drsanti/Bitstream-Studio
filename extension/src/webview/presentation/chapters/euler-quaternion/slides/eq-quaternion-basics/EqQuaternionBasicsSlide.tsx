import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";
import { QuaternionWireframeSvg } from "../../../_shared/visual/diagrams/QuaternionWireframeSvg";

export default function EqQuaternionBasicsSlide() {
  return (
    <TheorySlideLayout
      eyebrow="Quaternion"
      title="Unit quaternion q = (w, x, y, z)"
      subtitle="w is the scalar part; (x, y, z) is the rotation axis scaled by sin(θ/2)."
      visualLabel="Components"
      visualAccent="purple"
      visual={<QuaternionWireframeSvg />}
    >
      <div className="grid max-w-xl grid-cols-2 gap-3">
        {[
          ["w", "cos(θ/2) — scalar"],
          ["x, y, z", "axis · sin(θ/2)"],
          ["Constraint", "x² + y² + z² + w² = 1"],
          ["BS2 wire", "scaled integers in QUAT mask 0x10"],
        ].map(([k, v]) => (
          <div
            key={k}
            className="rounded-lg border border-[var(--surface-border)] bg-[var(--surface-card)] px-4 py-3"
          >
            <div className="text-sm font-bold text-[var(--accent-purple)]">{k}</div>
            <div className="mt-1 text-sm text-[var(--text-secondary)]">{v}</div>
          </div>
        ))}
      </div>
    </TheorySlideLayout>
  );
}
