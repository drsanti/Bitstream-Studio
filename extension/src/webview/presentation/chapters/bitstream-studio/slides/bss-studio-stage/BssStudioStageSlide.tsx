import { TheoryBulletList } from "../../../_shared/components/TheoryBulletList";
import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";
import { StageWorkbenchSvg } from "../../../_shared/visual/diagrams/StageWorkbenchSvg";

export default function BssStudioStageSlide() {
  return (
    <TheorySlideLayout
      eyebrow="Sensor Studio"
      title="Stage viewport"
      subtitle="3D scene committed from Flow Scene Output — orbit, gizmo, Edit vs Simulate."
      visualLabel="Stage pane"
      visualAccent="purple"
      visual={<StageWorkbenchSvg />}
      footer="Spec: extension/src/webview/sensor-studio/docs/STAGE_VIEWPORT_AND_SCENE_OUTPUT.md"
    >
      <TheoryBulletList
        accent="var(--accent-purple)"
        items={[
          "Scene Output node wires models, meshes, materials, and environment into the Stage evaluator.",
          "Stage pane renders the committed snapshot each flow tick — same live store as Telemetry and Presentation.",
          "Edit mode: LMB selection, transform gizmo, spawn primitives at cursor; Simulate freezes passive edits.",
          "GLB drives, procedural meshes, and multi-model scenes share one viewport with orbit controls.",
        ]}
      />
    </TheorySlideLayout>
  );
}
