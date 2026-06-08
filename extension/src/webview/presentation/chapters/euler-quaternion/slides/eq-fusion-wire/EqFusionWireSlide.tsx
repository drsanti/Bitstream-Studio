import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";

export default function EqFusionWireSlide() {
  return (
    <TheorySlideLayout
      eyebrow="On the wire"
      title="Publishing fusion in BS2"
      subtitle="SENSOR_CFG publish mask adds EULER and/or QUAT to BMI270 EVT_SENSOR payloads."
    >
      <div className="flex max-w-2xl flex-col gap-3 text-sm text-[var(--text-secondary)]">
        <p>
          Decode order on host:{" "}
          <span className="text-[var(--text-primary)]">ACC → GYR → TMP → EULER → QUAT</span> per mask bits in{" "}
          <span className="text-[var(--accent-cyan)]">bmi270.ts</span>.
        </p>
        <p>
          Presentation reads the same decoded fields as Sensor Telemetry —{" "}
          <span className="text-[var(--text-primary)]">fusionHeadingRadX100</span>, quaternion buckets, etc.
        </p>
        <p>
          Enable only what you teach: raw 6-DoF labs need ACC+GYR; attitude demos need EULER or QUAT.
        </p>
      </div>
    </TheorySlideLayout>
  );
}
