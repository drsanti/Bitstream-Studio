import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";
import { SensorCfgLayersSvg } from "../../../_shared/visual/diagrams/SensorCfgLayersSvg";

const SENSORS = [
  { id: "0", name: "BMI270", fields: "ACC · GYR · TMP · EULER · QUAT" },
  { id: "1", name: "BMM350", fields: "MAG vector · TMP" },
  { id: "2", name: "SHT40", fields: "TMP · RH" },
  { id: "3", name: "DPS368", fields: "Pressure · TMP" },
];

export default function BssTelemetryConfigSlide() {
  return (
    <TheorySlideLayout
      eyebrow="Sensor Telemetry"
      title="Sensor configuration"
      subtitle="SENSOR_CFG v2 draft in the settings deck — publish mask and rate control what EVT_SENSOR carries."
      visualLabel="Config layers"
      visualAccent="purple"
      visual={<SensorCfgLayersSvg />}
    >
      <div className="flex max-w-2xl flex-col gap-2">
        {SENSORS.map(({ id, name, fields }) => (
          <div
            key={id}
            className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-card)] px-4 py-3"
          >
            <span className="w-8 shrink-0 text-sm font-semibold text-[var(--accent-purple)]">{id}</span>
            <span className="w-20 shrink-0 text-sm font-bold text-[var(--text-primary)]">{name}</span>
            <span className="text-sm text-[var(--text-secondary)]">{fields}</span>
          </div>
        ))}
      </div>
      <p className="max-w-2xl text-2xs text-[var(--text-muted)]">
        v0.1: UI updates a local SENSOR_CFG draft (`updatedAtMs: 0`). Wire restore via `SENSOR_CFG_SET` is platform
        backlog — sensor chapters teach masks; students mirror drafts in Sensor Telemetry.
      </p>
    </TheorySlideLayout>
  );
}
