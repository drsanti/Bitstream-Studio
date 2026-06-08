import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";
import { TheoryBulletList } from "../../../_shared/components/TheoryBulletList";

export default function BssSummarySlide() {
  return (
    <TheorySlideLayout
      eyebrow="Next steps"
      title="Platform recap"
      subtitle="You are ready for sensor chapters — starting with BMI270."
    >
      <TheoryBulletList
        accent="var(--accent-green)"
        items={[
          "Dev stack: `npm run start:bridge` + `npm run dev:webview` → ?workspace=presentation",
          "VS Code: install VSIX or F5 extension host · command Open Presentation for projector panel",
          "Docs: extension/HOW_TO_RUN.md · TELEMETRY_MODE_LIFECYCLE.md · BS2_PROTOCOL_INDEX.md",
          "Continue → BMI270 chapter: physics, MEMS, live IMU demos",
        ]}
      />
    </TheorySlideLayout>
  );
}
