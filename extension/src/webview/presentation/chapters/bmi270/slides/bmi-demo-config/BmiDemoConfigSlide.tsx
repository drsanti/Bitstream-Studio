import { useState } from "react";
import { Settings2 } from "lucide-react";
import { usePresentationBmi270 } from "../../../../app/usePresentationSensor";
import { LabSlideLayout } from "../../../_shared/layouts/LabSlideLayout";
import { ValueDisplay } from "../../../../widgets/ValueDisplay";
import { TRNButton } from "../../../../../ui/TRN/TRNButton";
import {
  BMI270_ACC_ODRS,
  BMI270_ACC_RANGES,
  BMI270_GYR_ODRS,
  BMI270_GYR_RANGES,
  bmi270AccResolutionMgPerLsb,
  bmi270GyrResolutionDegPerLsb,
  type Bmi270DraftConfig,
} from "./bmi270-config-options";

function RangePicker<T extends number>({
  label,
  options,
  value,
  onChange,
  format,
  color,
}: {
  label: string;
  options: T[];
  value: T;
  onChange: (v: T) => void;
  format: (v: T) => string;
  color: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-2xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const selected = opt === value;
          return (
            <TRNButton
              key={opt}
              type="button"
              selected={selected}
              size="compact"
              onClick={() => onChange(opt)}
              className="!min-w-0 !px-2.5 !py-1 !text-xs"
              style={selected ? { color, borderColor: color } : undefined}
            >
              {format(opt)}
            </TRNButton>
          );
        })}
      </div>
    </div>
  );
}

export default function BmiDemoConfigSlide() {
  const frame = usePresentationBmi270();
  const [config, setConfig] = useState<Bmi270DraftConfig>({
    accRange: 4,
    accOdr: 100,
    gyrRange: 500,
    gyrOdr: 100,
  });
  const [draftSaved, setDraftSaved] = useState(false);

  const accRes = bmi270AccResolutionMgPerLsb(config.accRange);
  const gyrRes = bmi270GyrResolutionDegPerLsb(config.gyrRange);

  return (
    <LabSlideLayout
      title="Sensor configuration lab"
      objective="Pick accelerometer and gyroscope full-scale range and ODR, then apply the same draft in Sensor Telemetry."
      steps={[
        "Connect Bitstream or Simulator and confirm BMI270 samples on the live panel.",
        "Choose ±g and Hz values — note how resolution (mg/LSB, °/s/LSB) changes with range.",
        "Open Sensor Telemetry → BMI270 settings and mirror this draft (SENSOR_CFG v2 local apply).",
        "Observe waveforms and 3D demos after changing range/ODR.",
      ]}
      footer={
        draftSaved
          ? "Draft noted — apply matching values in Sensor Telemetry deck"
          : "Presentation keeps a teaching draft only; wire apply runs from Sensor Telemetry"
      }
    >
      <div className="grid h-full min-h-0 grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-5 overflow-y-auto scrollbar-hide">
          <div className="flex items-center gap-2">
            <Settings2 size={18} strokeWidth={1.5} style={{ color: "var(--accent-cyan)" }} />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--accent-cyan)]">Draft configuration</h3>
          </div>

          <section className="flex flex-col gap-3">
            <h4 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--axis-x)" }}>
              Accelerometer
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <RangePicker
                label="Full-scale range"
                options={BMI270_ACC_RANGES}
                value={config.accRange}
                onChange={(accRange) => setConfig((c) => ({ ...c, accRange }))}
                format={(v) => `±${v} g`}
                color="var(--axis-x)"
              />
              <RangePicker
                label="Output data rate"
                options={BMI270_ACC_ODRS}
                value={config.accOdr}
                onChange={(accOdr) => setConfig((c) => ({ ...c, accOdr }))}
                format={(v) => `${v} Hz`}
                color="var(--axis-x)"
              />
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Resolution: <span style={{ color: "var(--axis-x)" }}>{accRes.toFixed(3)} mg/LSB</span>
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h4 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--axis-y)" }}>
              Gyroscope
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <RangePicker
                label="Full-scale range"
                options={BMI270_GYR_RANGES}
                value={config.gyrRange}
                onChange={(gyrRange) => setConfig((c) => ({ ...c, gyrRange }))}
                format={(v) => `±${v} °/s`}
                color="var(--axis-y)"
              />
              <RangePicker
                label="Output data rate"
                options={BMI270_GYR_ODRS}
                value={config.gyrOdr}
                onChange={(gyrOdr) => setConfig((c) => ({ ...c, gyrOdr }))}
                format={(v) => `${v} Hz`}
                color="var(--axis-y)"
              />
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Resolution: <span style={{ color: "var(--axis-y)" }}>{gyrRes.toFixed(4)} °/s/LSB</span>
            </p>
          </section>

          <TRNButton
            selected={draftSaved}
            hint="Marks this draft for the lab — apply matching SENSOR_CFG in Sensor Telemetry"
            onClick={() => setDraftSaved(true)}
          >
            {draftSaved ? "Draft marked — open Sensor Telemetry" : "Mark draft ready for Telemetry deck"}
          </TRNButton>
        </div>

        <div className="flex flex-col justify-center gap-5 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] p-5">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Live readings</h3>
          <p className="text-xs text-[var(--text-secondary)]">
            After applying in Sensor Telemetry, return to accel/gyro demo slides to compare range and noise floor.
          </p>
          <div className="grid grid-cols-2 gap-5">
            <ValueDisplay label="aX" value={frame.accValid ? frame.ax : NaN} unit="g" color="var(--axis-x)" />
            <ValueDisplay label="aY" value={frame.accValid ? frame.ay : NaN} unit="g" color="var(--axis-y)" />
            <ValueDisplay label="aZ" value={frame.accValid ? frame.az : NaN} unit="g" color="var(--axis-z)" />
            <ValueDisplay label="ωX" value={frame.gyrValid ? frame.gx : NaN} unit="°/s" color="var(--axis-x)" decimals={1} />
            <ValueDisplay label="ωY" value={frame.gyrValid ? frame.gy : NaN} unit="°/s" color="var(--axis-y)" decimals={1} />
            <ValueDisplay label="ωZ" value={frame.gyrValid ? frame.gz : NaN} unit="°/s" color="var(--axis-z)" decimals={1} />
          </div>
          <div className="rounded-lg border border-[var(--surface-border)] bg-[var(--surface-panel)] p-3">
            <div className="mb-2 text-2xs uppercase tracking-wider text-[var(--text-muted)]">Draft payload (teaching)</div>
            <pre className="overflow-x-auto text-xs text-[var(--accent-cyan)]">
              {JSON.stringify({ sensorId: 0, accRange: config.accRange, accOdr: config.accOdr, gyrRange: config.gyrRange, gyrOdr: config.gyrOdr }, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </LabSlideLayout>
  );
}
