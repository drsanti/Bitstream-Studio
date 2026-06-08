import { usePresentationBmi270 } from "../../../../app/usePresentationSensor";
import { DemoSlideLayout } from "../../../_shared/layouts/DemoSlideLayout";

export default function BmiLiveStatusSlide() {
  const frame = usePresentationBmi270();

  return (
    <DemoSlideLayout
      layout="grid-2x3"
      title="Live BMI270 snapshot"
      subtitle="Values read from Bitstream Studio live store. Connect in Sensor Telemetry, then return here."
      theoryStrip="Accelerometer reports linear acceleration (g); gyroscope reports angular rate (°/s)."
      footer={
        frame.hasSample
          ? "Receiving BMI270 samples"
          : "No BMI270 sample yet — start bridge + telemetry route"
      }
    >
      {[
        { label: "aX", value: frame.ax, unit: "g", color: "var(--axis-x)", ok: frame.accValid },
        { label: "aY", value: frame.ay, unit: "g", color: "var(--axis-y)", ok: frame.accValid },
        { label: "aZ", value: frame.az, unit: "g", color: "var(--axis-z)", ok: frame.accValid },
        { label: "ωX", value: frame.gx, unit: "°/s", color: "var(--axis-x)", ok: frame.gyrValid },
        { label: "ωY", value: frame.gy, unit: "°/s", color: "var(--axis-y)", ok: frame.gyrValid },
        { label: "ωZ", value: frame.gz, unit: "°/s", color: "var(--axis-z)", ok: frame.gyrValid },
      ].map(({ label, value, unit, color, ok }) => (
        <div
          key={label}
          className="flex flex-col justify-center rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] p-4"
        >
          <div className="text-2xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            {label}
          </div>
          <div className="mt-1 text-2xl font-bold" style={{ color }}>
            {ok ? value.toFixed(3) : "—"} <span className="text-sm font-normal">{unit}</span>
          </div>
        </div>
      ))}
    </DemoSlideLayout>
  );
}
