import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";
import { FusionPipelineSvg } from "../../../_shared/visual/diagrams/FusionPipelineSvg";

export default function BssStudioIntroSlide() {
  return (
    <TheorySlideLayout
      eyebrow="Sensor Studio"
      title="Flow workbench"
      subtitle="One canvas: sensor sources → math / logic → Stage 3D or Dashboard widgets."
      visualLabel="Flow mental model"
      visualAccent="purple"
      visual={<FusionPipelineSvg />}
    >
      <div className="flex max-w-xl flex-col gap-3 text-sm text-[var(--text-secondary)]">
        <p>
          <span className="font-semibold text-[var(--text-primary)]">Flow</span> evaluates on each telemetry tick —
          wire BMI270, BMM350, DPS368, and SHT40 nodes into gauges, plots, and 3D drives.
        </p>
        <p>
          <span className="font-semibold text-[var(--text-primary)]">Stage</span> commits scene output;{" "}
          <span className="font-semibold text-[var(--text-primary)]">Dashboard</span> lays out operator widgets.
        </p>
        <p>Presentation demos read the same live store — no duplicate decoder in the training deck.</p>
      </div>
    </TheorySlideLayout>
  );
}
