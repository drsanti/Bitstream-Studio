import { Cpu } from "lucide-react";
import { TitleHeroLayout } from "../../../_shared/visual/TitleHeroLayout";
import { ImuChipHero3D } from "../../../_shared/visual/diagrams/ImuChipHero3D";

export default function BmiTitleSlide() {
  return (
    <TitleHeroLayout
      accent="amber"
      icon={<Cpu size={28} strokeWidth={1.5} style={{ color: "var(--accent-amber)" }} />}
      badge="sensorId 0"
      title="BMI270 — 6-DoF IMU"
      subtitle="Accelerometer + gyroscope on one die — theory, MEMS physics, and live BS2 demos."
      visual={<ImuChipHero3D />}
    />
  );
}
