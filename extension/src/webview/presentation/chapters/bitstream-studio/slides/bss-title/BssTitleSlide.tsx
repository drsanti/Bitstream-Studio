import { Layers } from "lucide-react";
import { TitleHeroLayout } from "../../../_shared/visual/TitleHeroLayout";
import { PlatformHubSvg } from "../../../_shared/visual/diagrams/PlatformHubSvg";

export default function BssTitleSlide() {
  return (
    <TitleHeroLayout
      accent="cyan"
      icon={<Layers size={28} strokeWidth={1.5} style={{ color: "var(--accent-cyan)" }} />}
      badge="Bitstream Studio"
      title="Sensor Telemetry, Sensor Studio & Live BS2 Data"
      subtitle="Training companion integrated in Bitstream Studio — same broker, same decode path as the telemetry deck."
      visual={<PlatformHubSvg />}
    />
  );
}
