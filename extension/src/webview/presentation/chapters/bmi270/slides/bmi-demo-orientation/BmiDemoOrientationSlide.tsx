import { usePresentationBmi270 } from "../../../../app/usePresentationSensor";
import { DemoSlideLayout } from "../../../_shared/layouts/DemoSlideLayout";
import { LiveBar } from "../../../../widgets/LiveBar";
import { BmiPcbOrientationScene } from "../../../../widgets/r3f/BmiPcbOrientationScene";
import {
  PresentationSceneLiveOverlay,
  PresentationSceneParamRow,
} from "../../../../widgets/r3f/PresentationSceneLiveOverlay";

export default function BmiDemoOrientationSlide() {
  const frame = usePresentationBmi270();

  const axes = [
    { label: "aX", value: frame.ax, color: "var(--axis-x)", desc: "Forward / back" },
    { label: "aY", value: frame.ay, color: "var(--axis-y)", desc: "Left / right" },
    { label: "aZ", value: frame.az, color: "var(--axis-z)", desc: "Up / down" },
  ];

  const accelOverlay = (
    <PresentationSceneLiveOverlay title="Accel (live)">
      <div className="presentation-scene-param-grid presentation-scene-param-grid--single">
        {axes.map(({ label, value, color }) => (
          <PresentationSceneParamRow
            key={label}
            label={label}
            value={frame.accValid ? value : NaN}
            decimals={3}
            unit="g"
            color={color}
          />
        ))}
      </div>
    </PresentationSceneLiveOverlay>
  );

  return (
    <DemoSlideLayout
      layout="demo-rail"
      title="Coordinates & 3D board"
      subtitle="Flat on table → aZ ≈ +1 g. Model follows fusion quaternion when published on the wire."
      theoryStrip="Right-hand frame — values overlay the 3D view; bars below track each axis."
      scene={<BmiPcbOrientationScene framed overlay={accelOverlay} />}
    >
      <div className="flex flex-col gap-4">
        {axes.map(({ label, value, color, desc }) => (
          <div key={label} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: color }} />
              <span className="text-xs font-semibold" style={{ color }}>
                {label}
              </span>
              <span className="text-2xs text-[var(--text-muted)]">{desc}</span>
            </div>
            <LiveBar value={frame.accValid ? value : 0} min={-2} max={2} color={color} height={6} />
          </div>
        ))}
      </div>
    </DemoSlideLayout>
  );
}
