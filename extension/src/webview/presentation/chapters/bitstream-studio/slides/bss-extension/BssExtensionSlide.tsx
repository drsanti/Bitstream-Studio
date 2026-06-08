import { TheoryBulletList } from "../../../_shared/components/TheoryBulletList";
import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";
import { ExtensionDeliverySvg } from "../../../_shared/visual/diagrams/ExtensionDeliverySvg";

export default function BssExtensionSlide() {
  return (
    <TheorySlideLayout
      eyebrow="Delivery"
      title="VS Code extension"
      subtitle="One product id — `bitstream-studio` — same webview bundle in dev and installed VSIX."
      visualLabel="Dev vs VSIX"
      visualAccent="cyan"
      visual={<ExtensionDeliverySvg />}
    >
      <TheoryBulletList
        accent="var(--accent-cyan)"
        items={[
          "Toolbar switches workspaces: Sensor Telemetry · Sensor Studio · Presentation.",
          "Browser dev: `npm run dev:webview` → `http://localhost:5173/?workspace=bitstream` (or `sensor-studio`, `presentation`).",
          "Installed VSIX: panels open inside VS Code; use `isVsCodeExtensionWebview()` for host-only features.",
          "Presentation can open as a workspace tab or a separate side panel (`openPresentation`) for projector layouts.",
        ]}
      />
    </TheorySlideLayout>
  );
}
