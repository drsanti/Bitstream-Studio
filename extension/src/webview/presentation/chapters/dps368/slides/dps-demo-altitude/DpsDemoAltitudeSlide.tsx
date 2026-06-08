import { usePresentationDps368 } from "../../../../app/usePresentationSensor";
import { DemoSlideLayout } from "../../../_shared/layouts/DemoSlideLayout";
import { LiveBar } from "../../../../widgets/LiveBar";
import {
  PresentationSceneLiveOverlay,
  PresentationSceneParamRow,
} from "../../../../widgets/r3f/PresentationSceneLiveOverlay";
import { BaroPressureSvg } from "../../../_shared/visual/diagrams/BaroPressureSvg";

export default function DpsDemoAltitudeSlide() {
  const frame = usePresentationDps368(1013.25);

  const hud = (
    <PresentationSceneLiveOverlay title="Baro estimate">
      <div className="presentation-scene-param-grid presentation-scene-param-grid--single">
        <PresentationSceneParamRow
          label="P"
          value={frame.pressureValid ? frame.pressureHpa : NaN}
          decimals={2}
          unit="hPa"
          color="var(--accent-cyan)"
        />
        <PresentationSceneParamRow
          label="alt"
          value={frame.pressureValid ? frame.altitudeM : NaN}
          decimals={1}
          unit="m"
          color="var(--accent-amber)"
        />
      </div>
    </PresentationSceneLiveOverlay>
  );

  return (
    <DemoSlideLayout
      layout="demo-rail"
      title="Derived altitude"
      subtitle="Reference P₀ = 1013.25 hPa — barometric estimate from live pressure."
      theoryStrip="Climb or descend slowly; recalibrate reference if weather shifts during the lab."
      footer={frame.pressureValid ? "ISA simplified formula — not GPS elevation" : "Enable DPS368 pressure stream"}
      scene={
        <div className="relative flex h-full w-full min-h-0 items-center justify-center bg-[var(--scene-bg)] p-8">
          <div className="h-full w-full max-w-md">
            <BaroPressureSvg />
          </div>
          <div className="presentation-scene-overlay-layer">{hud}</div>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <LiveBar
          label="Altitude estimate"
          value={frame.pressureValid ? frame.altitudeM : 0}
          min={-50}
          max={200}
          color="var(--accent-amber)"
          height={10}
          showValue
          unit="m"
          decimals={1}
        />
        <p className="text-sm text-[var(--text-secondary)]">
          Lab: note pressure at floor level, then climb one flight — compare Δh with the formula and your building map.
        </p>
      </div>
    </DemoSlideLayout>
  );
}
