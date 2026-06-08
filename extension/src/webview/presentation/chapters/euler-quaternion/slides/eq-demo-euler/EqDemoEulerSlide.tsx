import { usePresentationBmi270 } from "../../../../app/usePresentationSensor";
import { DemoSlideLayout } from "../../../_shared/layouts/DemoSlideLayout";
import { LiveBar } from "../../../../widgets/LiveBar";
import { BmiPcbOrientationScene } from "../../../../widgets/r3f/BmiPcbOrientationScene";
import {
  PresentationSceneLiveOverlay,
  PresentationSceneParamRow,
} from "../../../../widgets/r3f/PresentationSceneLiveOverlay";

export default function EqDemoEulerSlide() {
  const frame = usePresentationBmi270();

  const angles = [
    { label: "heading", value: frame.heading, color: "var(--axis-z)" },
    { label: "pitch", value: frame.pitch, color: "var(--axis-y)" },
    { label: "roll", value: frame.roll, color: "var(--axis-x)" },
  ];

  const eulerOverlay = (
    <PresentationSceneLiveOverlay title="Euler (live)">
      <div className="presentation-scene-param-grid presentation-scene-param-grid--single">
        {angles.map(({ label, value, color }) => (
          <PresentationSceneParamRow
            key={label}
            label={label}
            value={frame.eulerValid ? value : NaN}
            decimals={2}
            unit="°"
            color={color}
          />
        ))}
      </div>
    </PresentationSceneLiveOverlay>
  );

  return (
    <DemoSlideLayout
      layout="demo-rail"
      title="Live Euler angles"
      subtitle="Requires EVT mask 0x08 — enable fusion publish in SENSOR_CFG."
      theoryStrip="Heading / pitch / roll overlay the 3D board — fused outputs, not raw gyro integration."
      footer={
        frame.eulerValid
          ? "Receiving EULER fields from live store"
          : "No EULER sample yet — enable fusion mask and telemetry route"
      }
      scene={<BmiPcbOrientationScene framed overlay={eulerOverlay} />}
    >
      <div className="flex flex-col gap-4">
        {angles.map(({ label, value, color }) => (
          <LiveBar
            key={label}
            label={label}
            value={frame.eulerValid ? value : 0}
            min={-180}
            max={180}
            color={color}
            height={8}
            showValue
            unit="°"
            decimals={1}
          />
        ))}
      </div>
    </DemoSlideLayout>
  );
}
