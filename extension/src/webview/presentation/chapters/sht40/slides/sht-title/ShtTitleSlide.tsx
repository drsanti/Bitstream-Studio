import { Droplets } from "lucide-react";
import { TitleHeroLayout } from "../../../_shared/visual/TitleHeroLayout";
import { ComfortZoneSvg } from "../../../_shared/visual/diagrams/ComfortZoneSvg";

export default function ShtTitleSlide() {
  return (
    <TitleHeroLayout
      accent="cyan"
      icon={<Droplets size={28} strokeWidth={1.5} style={{ color: "var(--accent-cyan)" }} />}
      badge="sensorId 2"
      title="SHT40 — Temperature & humidity"
      subtitle="Relative humidity and die temperature for comfort, HVAC, and environmental monitoring."
      visual={<ComfortZoneSvg tempC={24} rhPct={52} showMarker />}
    />
  );
}
