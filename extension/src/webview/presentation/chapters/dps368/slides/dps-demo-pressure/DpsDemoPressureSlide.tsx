import { useEffect, useRef } from "react";
import { usePresentationDps368 } from "../../../../app/usePresentationSensor";
import { DemoSlideLayout } from "../../../_shared/layouts/DemoSlideLayout";
import { PresentationVisualPanel } from "../../../_shared/visual/PresentationVisualPanel";
import { WaveCanvas } from "../../../../widgets/WaveCanvas";
import {
  PresentationSceneLiveOverlay,
  PresentationSceneParamRow,
} from "../../../../widgets/r3f/PresentationSceneLiveOverlay";

const HISTORY = 160;

export default function DpsDemoPressureSlide() {
  const frame = usePresentationDps368();
  const buf = useRef(new Float32Array(HISTORY));
  const head = useRef(0);

  useEffect(() => {
    if (!frame.pressureValid) {
      return;
    }
    buf.current[head.current] = frame.pressureHpa;
    head.current = (head.current + 1) % HISTORY;
  }, [frame.pressureHpa, frame.pressureValid]);

  const linear = () => {
    const h = head.current;
    const out = new Float32Array(HISTORY);
    for (let i = 0; i < HISTORY; i++) {
      out[i] = buf.current[(h + i) % HISTORY];
    }
    return out;
  };

  const pressureOverlay = (
    <PresentationSceneLiveOverlay title="Pressure" position="top-left">
      <div className="presentation-scene-param-grid presentation-scene-param-grid--single">
        <PresentationSceneParamRow
          label="P"
          value={frame.pressureValid ? frame.pressureHpa : NaN}
          decimals={2}
          unit="hPa"
          color="var(--accent-cyan)"
        />
        <PresentationSceneParamRow
          label="T"
          value={frame.tempValid ? frame.temp : NaN}
          decimals={1}
          unit="°C"
          color="var(--accent-amber)"
        />
      </div>
    </PresentationSceneLiveOverlay>
  );

  return (
    <DemoSlideLayout
      title="Live pressure trend"
      subtitle="DPS368 often updates slowly — watch the scrolling history for drift and steps."
      theoryStrip="Slow breath near the sensor or climbing stairs changes the trace."
      footer={
        frame.pressureValid
          ? `Live ${frame.pressureHpa.toFixed(2)} hPa`
          : "No DPS368 pressure — enable PRESS mask on sensorId 3"
      }
    >
      <div className="relative flex h-full min-h-0 flex-col gap-3">
        <PresentationVisualPanel label="Pressure history" accent="cyan" className="min-h-[200px] flex-1">
          <WaveCanvas
            channels={[
              {
                color: "var(--accent-cyan)",
                gradFrom: "var(--accent-cyan)",
                gradTo: "transparent",
                data: linear(),
              },
            ]}
            min={980}
            max={1040}
            lineWidth={2}
          />
        </PresentationVisualPanel>
        <div className="presentation-scene-overlay-layer pointer-events-none absolute inset-0">
          {pressureOverlay}
        </div>
      </div>
    </DemoSlideLayout>
  );
}
