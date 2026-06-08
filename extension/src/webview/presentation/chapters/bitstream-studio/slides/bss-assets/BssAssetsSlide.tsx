import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";
import { AssetsCatalogSvg } from "../../../_shared/visual/diagrams/AssetsCatalogSvg";

const ASSETS = [
  {
    name: "Models",
    detail: "GLB catalog and free-pack mirrors — Stage, Model Viewer, rotation previews resolve via manifest URLs.",
    accent: "var(--accent-cyan)",
  },
  {
    name: "Flow presets",
    detail: "Official starter graphs (BMI270 lab, audio machine, stage-camera-vision, …) — load from library or free pack.",
    accent: "var(--accent-purple)",
  },
  {
    name: "Vision packs",
    detail: "MediaPipe bundle for camera / landmark nodes — optional download; browse tab shows availability.",
    accent: "var(--accent-amber)",
  },
];

export default function BssAssetsSlide() {
  return (
    <TheorySlideLayout
      eyebrow="Ecosystem"
      title="Asset Manager"
      subtitle="Curated models, flow presets, and vision packs — one manifest, globalStorage on disk."
      visualLabel="Catalog buckets"
      visualAccent="purple"
      visual={<AssetsCatalogSvg />}
      footer="Operator path: Asset Manager → Browse / Actions — not a full tutorial in this deck."
    >
      <div className="flex max-w-2xl flex-col gap-3">
        {ASSETS.map(({ name, detail, accent }) => (
          <div
            key={name}
            className="rounded-lg border border-[var(--surface-border)] bg-[var(--surface-card)] px-4 py-3"
          >
            <div className="text-sm font-bold" style={{ color: accent }}>
              {name}
            </div>
            <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">{detail}</p>
          </div>
        ))}
      </div>
    </TheorySlideLayout>
  );
}
