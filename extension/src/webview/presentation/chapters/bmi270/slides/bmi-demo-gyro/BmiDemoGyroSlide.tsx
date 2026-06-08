import { usePresentationBmi270 } from "../../../../app/usePresentationSensor";
import { DemoSlideLayout } from "../../../_shared/layouts/DemoSlideLayout";
import { LiveBar } from "../../../../widgets/LiveBar";
import { BmiGyroGimbalScene } from "../../../../widgets/r3f/BmiGyroGimbalScene";
import {
  PresentationSceneLiveOverlay,
  PresentationSceneParamRow,
} from "../../../../widgets/r3f/PresentationSceneLiveOverlay";

export default function BmiDemoGyroSlide() {
  const frame = usePresentationBmi270();

  const axes = [
    { label: "ωX", value: frame.gx, color: "var(--axis-x)" },
    { label: "ωY", value: frame.gy, color: "var(--axis-y)" },
    { label: "ωZ", value: frame.gz, color: "var(--axis-z)" },
  ];

  const gyroOverlay = (
    <PresentationSceneLiveOverlay title="Gyro rates">
      <div className="presentation-scene-param-grid presentation-scene-param-grid--single">
        {axes.map(({ label, value, color }) => (
          <PresentationSceneParamRow
            key={label}
            label={label}
            value={frame.gyrValid ? value : NaN}
            decimals={1}
            unit="°/s"
            color={color}
          />
        ))}
      </div>
    </PresentationSceneLiveOverlay>
  );

  return (
    <DemoSlideLayout
      layout="demo-rail"
      title="Gyroscope rates"
      subtitle="Integrating ω alone drifts — fusion (Euler / quaternion) is the next chapter."
      theoryStrip="Rates overlay the gimbal view — orbit to inspect ring motion."
      scene={<BmiGyroGimbalScene framed overlay={gyroOverlay} />}
    >
      <div className="flex flex-col gap-4">
        {axes.map(({ label, value, color }) => (
          <LiveBar
            key={label}
            label={label}
            value={frame.gyrValid ? value : 0}
            min={-500}
            max={500}
            color={color}
            height={8}
            showValue
            unit="°/s"
            decimals={1}
          />
        ))}
        <p className="text-2xs text-[var(--text-muted)]">
          Rings integrate live ω (teaching only — drift without fusion).
        </p>
      </div>
    </DemoSlideLayout>
  );
}
