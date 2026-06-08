import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";
import { CompassRoseSvg } from "../../../_shared/visual/diagrams/CompassRoseSvg";

export default function BmmHeadingSlide() {
  return (
    <TheorySlideLayout
      eyebrow="Foundations"
      title="Heading from magnetometer"
      subtitle="Level compass assumption — board flat, Z roughly vertical."
      visualLabel="Compass"
      visualAccent="green"
      visual={<CompassRoseSvg headingDeg={42} />}
    >
      <div className="flex max-w-xl flex-col gap-3 text-sm text-[var(--text-secondary)]">
        <p>
          With the board level, heading from the horizontal components:
        </p>
        <p className="rounded-lg border border-[var(--surface-border)] bg-[var(--surface-card)] px-4 py-3 text-[var(--accent-green)]">
          heading = atan2(By, Bx) → degrees
        </p>
        <p>
          Tilt breaks the level assumption — fusion uses gyro + accel + mag for stable attitude (see Euler &
          Quaternion chapter).
        </p>
        <p>
          Motors, batteries, and steel mounts add <span className="text-[var(--text-primary)]">hard-iron</span> offset
          and <span className="text-[var(--text-primary)]">soft-iron</span> scaling — calibrate before trusting heading.
        </p>
      </div>
    </TheorySlideLayout>
  );
}
