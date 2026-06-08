import { usePresentationBmm350 } from "../../../../app/usePresentationSensor";
import { DemoSlideLayout } from "../../../_shared/layouts/DemoSlideLayout";
import { CompassRoseSvg } from "../../../_shared/visual/diagrams/CompassRoseSvg";
import {
  PresentationSceneLiveOverlay,
  PresentationSceneParamRow,
} from "../../../../widgets/r3f/PresentationSceneLiveOverlay";

export default function BmmDemoCompassSlide() {
  const frame = usePresentationBmm350();
  const heading = frame.magValid ? ((frame.headingDeg % 360) + 360) % 360 : NaN;

  const compassOverlay = (
    <PresentationSceneLiveOverlay title="Compass">
      <div className="presentation-scene-param-grid presentation-scene-param-grid--single">
        <PresentationSceneParamRow
          label="heading"
          value={heading}
          decimals={1}
          unit="°"
          color="var(--accent-green)"
        />
        <PresentationSceneParamRow
          label="Bx"
          value={frame.magValid ? frame.bx : NaN}
          decimals={2}
          unit="µT"
          color="var(--axis-x)"
        />
        <PresentationSceneParamRow
          label="By"
          value={frame.magValid ? frame.by : NaN}
          decimals={2}
          unit="µT"
          color="var(--axis-y)"
        />
      </div>
    </PresentationSceneLiveOverlay>
  );

  return (
    <DemoSlideLayout
      layout="demo-rail"
      title="Compass heading"
      subtitle="Level-board assumption — rotate flat and watch atan2(By, Bx)."
      theoryStrip="Heading and field components overlay the compass — keep the board flat."
      footer={
        frame.magValid
          ? `Heading ${Number.isFinite(heading) ? heading.toFixed(1) : "—"}° — keep board flat`
          : "Publish MAG on BMM350 for heading demo"
      }
      scene={
        <div className="relative flex h-full w-full min-h-0 flex-col bg-[var(--scene-bg)]">
          <div className="flex min-h-0 flex-1 items-center justify-center p-6">
            <div className="h-full w-full max-w-xl">
              <CompassRoseSvg headingDeg={Number.isFinite(heading) ? heading : 0} />
            </div>
          </div>
          <div className="presentation-scene-overlay-layer">{compassOverlay}</div>
        </div>
      }
    >
      <ul className="flex max-w-md flex-col gap-2 text-sm text-[var(--text-secondary)]">
        <li>Rotate the board on a flat surface — heading should track smoothly.</li>
        <li>Nearby motors or steel shift Bx/By — discuss hard-iron distortion.</li>
        <li>Tilt breaks the level assumption — fusion needs accel + mag.</li>
      </ul>
    </DemoSlideLayout>
  );
}
