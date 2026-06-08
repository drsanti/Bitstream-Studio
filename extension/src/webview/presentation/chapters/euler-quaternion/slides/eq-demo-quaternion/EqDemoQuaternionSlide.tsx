import { usePresentationBmi270 } from "../../../../app/usePresentationSensor";
import { DemoSlideLayout } from "../../../_shared/layouts/DemoSlideLayout";
import { BmiPcbOrientationScene } from "../../../../widgets/r3f/BmiPcbOrientationScene";
import {
  PresentationSceneLiveOverlay,
  PresentationSceneParamRow,
} from "../../../../widgets/r3f/PresentationSceneLiveOverlay";

export default function EqDemoQuaternionSlide() {
  const frame = usePresentationBmi270();

  const components = [
    { label: "qw", value: frame.qw },
    { label: "qx", value: frame.qx },
    { label: "qy", value: frame.qy },
    { label: "qz", value: frame.qz },
  ];

  const quatOverlay = (
    <PresentationSceneLiveOverlay title="Quaternion (live)">
      <div className="presentation-scene-param-grid">
        {components.map(({ label, value }) => (
          <PresentationSceneParamRow
            key={label}
            label={label}
            value={frame.quatValid ? value : NaN}
            decimals={4}
            color="var(--accent-purple)"
          />
        ))}
      </div>
    </PresentationSceneLiveOverlay>
  );

  return (
    <DemoSlideLayout
      layout="demo-rail"
      title="Live quaternion"
      subtitle="Mask 0x10 QUAT — 3D board uses the same quaternion as Sensor Studio."
      theoryStrip="Unit quaternion drives the attitude cube — orbit the scene to verify alignment. Values overlay the 3D viewport."
      footer={
        frame.quatValid ? "Quaternion valid — driving 3D model" : "Enable QUAT in publish mask for fusion output"
      }
      scene={<BmiPcbOrientationScene framed overlay={quatOverlay} />}
    >
      <ul className="flex max-w-md flex-col gap-2 text-sm text-[var(--text-secondary)]">
        <li>Watch qw stay near ±1 when attitude is stable; vector part (qx, qy, qz) encodes rotation axis × sin(θ/2).</li>
        <li>Orbit the board and compare numeric components to the visible orientation.</li>
        <li>Same decoded fields as Sensor Studio BMI270 → Quaternion tap node.</li>
      </ul>
    </DemoSlideLayout>
  );
}
