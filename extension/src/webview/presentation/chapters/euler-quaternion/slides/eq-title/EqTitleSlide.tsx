import { Orbit } from "lucide-react";
import { TitleHeroLayout } from "../../../_shared/visual/TitleHeroLayout";
import { FusionCubeHero3D } from "../../../_shared/visual/diagrams/FusionCubeHero3D";

export default function EqTitleSlide() {
  return (
    <TitleHeroLayout
      accent="purple"
      icon={<Orbit size={28} strokeWidth={1.5} style={{ color: "var(--accent-purple)" }} />}
      title="Euler Angles & Quaternion"
      subtitle="How firmware fusion turns noisy gyro + gravity into stable attitude — and how BS2 publishes it."
      visual={<FusionCubeHero3D />}
    />
  );
}
