import { TheoryBulletList } from "../../../_shared/components/TheoryBulletList";
import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";
import { PresentationWorkspaceSvg } from "../../../_shared/visual/diagrams/PresentationWorkspaceSvg";

export default function BssPresentationAppSlide() {
  return (
    <TheorySlideLayout
      eyebrow="Ecosystem"
      title="Presentation workspace"
      subtitle="Training deck inside Bitstream Studio — not a standalone app with its own decoder."
      visualLabel="Delivery"
      visualAccent="amber"
      visual={<PresentationWorkspaceSvg />}
      footer="Canonical code: extension/src/webview/presentation/ · INTEGRATION.md"
    >
      <TheoryBulletList
        accent="var(--accent-amber)"
        items={[
          "Third workspace tab plus optional VS Code side panel (openPresentation) for projector / dual-monitor teaching.",
          "Chapters: platform → BMI270 → Euler → BMM350 → DPS368 → SHT40 — theory, live demos, labs.",
          "Reads useBitstreamLiveStore via presentation selectors — same broker bootstrap as Telemetry and Studio.",
          "Light/dark presentation theme is scoped to the deck; presenter tools: zoom, laser, present mode.",
          "Repo-root presentation/ folder is legacy archive only — do not import from the extension bundle.",
        ]}
      />
    </TheorySlideLayout>
  );
}
