import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";

const MASKS = [
  { bit: "0x01", name: "PRESS", detail: "barometric pressure hPa×10" },
  { bit: "0x02", name: "TMP", detail: "temperature °C ×100" },
];

export default function DpsWireMaskSlide() {
  return (
    <TheorySlideLayout eyebrow="Integration" title="DPS368 on the wire" subtitle="sensorId 3 — pressure and temperature mask bits.">
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
    </TheorySlideLayout>
  );
}
