import { Magnet } from "lucide-react";
import { TitleHeroLayout } from "../../../_shared/visual/TitleHeroLayout";
import { CompassRoseSvg } from "../../../_shared/visual/diagrams/CompassRoseSvg";

export default function BmmTitleSlide() {
  return (
    <TitleHeroLayout
      accent="green"
      icon={<Magnet size={28} strokeWidth={1.5} style={{ color: "var(--accent-green)" }} />}
      badge="sensorId 1"
      title="BMM350 — Magnetometer"
      subtitle="Tri-axis magnetic field in µT — Earth's field, heading, and interference."
      visual={<CompassRoseSvg />}
    />
  );
}
