import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";
import { SensorPaletteGridSvg } from "../../../_shared/visual/diagrams/SensorPaletteGridSvg";

const SENSORS = [
  { id: "0", name: "BMI270", outputs: "Accel · Gyro · Euler · Quat · Temp" },
  { id: "1", name: "BMM350", outputs: "Mag vector · Temp" },
  { id: "2", name: "SHT40", outputs: "Humidity · Temp" },
  { id: "3", name: "DPS368", outputs: "Pressure · Temp" },
];

export default function BssStudioNodesSlide() {
  return (
    <TheorySlideLayout
      eyebrow="Sensor Studio"
      title="Sensor flow nodes"
      subtitle="Four BS2 sources in the palette — full nodes plus tap shortcuts for single outputs."
      visualLabel="Flow palette"
      visualAccent="purple"
      visual={<SensorPaletteGridSvg />}
      footer="Each hardware chapter includes a deep-dive *-studio-node slide with full port lists."
    >
      <div className="flex max-w-2xl flex-col gap-2">
        {SENSORS.map(({ id, name, outputs }) => (
          <div
            key={id}
            className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-card)] px-4 py-3"
          >
            <span className="w-8 shrink-0 text-sm font-semibold text-[var(--accent-purple)]">{id}</span>
            <span className="w-20 shrink-0 text-sm font-bold text-[var(--text-primary)]">{name}</span>
            <span className="text-sm text-[var(--text-secondary)]">{outputs}</span>
          </div>
        ))}
      </div>
      <p className="max-w-2xl text-sm text-[var(--text-secondary)]">
        <span className="font-semibold text-[var(--text-primary)]">Tap nodes</span> expose one port each — e.g.
        Quaternion, Magnetic, Humidity — when a flow only needs a single wire.
      </p>
    </TheorySlideLayout>
  );
}
