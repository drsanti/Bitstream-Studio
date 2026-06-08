import { Gauge } from "lucide-react";
import { TitleHeroLayout } from "../../../_shared/visual/TitleHeroLayout";
import { BaroPressureSvg } from "../../../_shared/visual/diagrams/BaroPressureSvg";

export default function DpsTitleSlide() {
  return (
    <TitleHeroLayout
      accent="cyan"
      icon={<Gauge size={28} strokeWidth={1.5} style={{ color: "var(--accent-cyan)" }} />}
      badge="sensorId 3"
      title="DPS368 — Barometric pressure"
      subtitle="Absolute pressure in hPa — weather, altitude, and slow environmental trends."
      visual={<BaroPressureSvg />}
    />
  );
}
