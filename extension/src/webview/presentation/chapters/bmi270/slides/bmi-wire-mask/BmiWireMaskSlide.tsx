import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";

const MASKS = [
  { bit: "0x01", name: "ACC", detail: "ax, ay, az (m/s² ×100 → g in UI)" },
  { bit: "0x02", name: "GYR", detail: "gx, gy, gz (rad/s ×100 → °/s)" },
  { bit: "0x04", name: "TMP", detail: "temperature °C ×100" },
  { bit: "0x08", name: "EULER", detail: "heading, pitch, roll (rad ×100 → °)" },
  { bit: "0x10", name: "QUAT", detail: "qw, qx, qy, qz (bucket / scaled ints)" },
];

export default function BmiWireMaskSlide() {
  return (
    <TheorySlideLayout
      eyebrow="Integration"
      title="BMI270 on the wire"
      subtitle="EVT_SENSOR mask selects which fields follow counter + timestamp in the payload."
    >
      <div className="flex max-w-2xl flex-col gap-2">
        {MASKS.map(({ bit, name, detail }) => (
          <div
            key={bit}
            className="flex gap-4 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-card)] px-4 py-3"
          >
            <span className="w-12 shrink-0 text-sm font-semibold text-[var(--accent-cyan)]">{bit}</span>
            <span className="w-16 shrink-0 text-sm font-bold text-[var(--text-primary)]">{name}</span>
            <span className="text-sm text-[var(--text-secondary)]">{detail}</span>
          </div>
        ))}
      </div>
      <p className="text-2xs text-[var(--text-muted)]">
        Canonical: `extension/src/bitstream2/domains/sensors/bmi270.ts`
      </p>
    </TheorySlideLayout>
  );
}
