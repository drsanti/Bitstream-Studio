import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";
import { TheoryBulletList } from "../../../_shared/components/TheoryBulletList";
import { EarthFieldSvg } from "../../../_shared/visual/diagrams/EarthFieldSvg";

export default function BmmEarthFieldSlide() {
  return (
    <TheorySlideLayout
      eyebrow="Foundations"
      title="Earth's magnetic field"
      subtitle="A vector at every point on the surface — strength and direction vary with location."
      visualLabel="Field geometry"
      visualAccent="green"
      visual={<EarthFieldSvg />}
    >
      <TheoryBulletList
        accent="var(--accent-green)"
        items={[
          "Reported in microtesla (µT); typical magnitude roughly 25–65 µT depending on latitude.",
          "Declination: angle between geographic north and field horizontal component.",
          "Inclination: dip angle into the ground — stronger vertical component near poles.",
          "BMM350 measures the field vector in the sensor frame — same right-hand axes as BMI270.",
        ]}
      />
    </TheorySlideLayout>
  );
}
