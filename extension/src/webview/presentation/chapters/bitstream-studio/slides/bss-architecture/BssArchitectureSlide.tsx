import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";
import { DataPathDiagram } from "../../../_shared/diagrams/DataPathDiagram";

export default function BssArchitectureSlide() {
  return (
    <TheorySlideLayout
      eyebrow="Architecture"
      title="End-to-end data path"
      subtitle="One broker fans out decoded samples to every Bitstream Studio workspace."
      visualLabel="Data path"
      visualAccent="cyan"
      visual={<DataPathDiagram />}
    >
      <p className="max-w-3xl text-2xs text-[var(--text-muted)]">
        Canonical docs: `extension/docs/BITSTREAM_BS_FRAMED_PROTOCOL_SPEC.md` · bridge default{" "}
        <span className="text-[var(--text-secondary)]">ws://127.0.0.1:9998</span>
      </p>
    </TheorySlideLayout>
  );
}
