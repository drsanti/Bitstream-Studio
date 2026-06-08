import { useEffect, useRef } from "react";
import { usePresentationSht40 } from "../../../../app/usePresentationSensor";
import { DemoSlideLayout } from "../../../_shared/layouts/DemoSlideLayout";
import { PresentationVisualPanel } from "../../../_shared/visual/PresentationVisualPanel";
import { WaveCanvas } from "../../../../widgets/WaveCanvas";
import {
  PresentationSceneLiveOverlay,
  PresentationSceneParamRow,
} from "../../../../widgets/r3f/PresentationSceneLiveOverlay";

const HISTORY = 160;

export default function ShtDemoRhSlide() {
  const frame = usePresentationSht40();
  const buf = useRef(new Float32Array(HISTORY));
  const head = useRef(0);

  useEffect(() => {
    if (!frame.rhValid) {
      return;
    }
    buf.current[head.current] = frame.rh;
    head.current = (head.current + 1) % HISTORY;
  }, [frame.rh, frame.rhValid]);

  const linear = () => {
    const h = head.current;
    const out = new Float32Array(HISTORY);
    for (let i = 0; i < HISTORY; i++) {
      out[i] = buf.current[(h + i) % HISTORY];
    }
    return out;
  };

  const hud = (
    <PresentationSceneLiveOverlay title="RH / T">
      <div className="presentation-scene-param-grid presentation-scene-param-grid--single">
        <PresentationSceneParamRow
          label="RH"
          value={frame.rhValid ? frame.rh : NaN}
          decimals={1}
          unit="%"
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
      title="Humidity trend"
      subtitle="Breathe near the sensor or seal in a bag — watch %RH move on the trace."
      theoryStrip="Capacitive polymer sensor — slow thermal mass; give it a few seconds to settle."
      footer={
        frame.rhValid
          ? `Live ${frame.rh.toFixed(1)} %RH`
          : "Enable HUM mask on sensorId 2"
      }
    >
      <div className="relative flex h-full min-h-0 flex-col gap-3">
        <PresentationVisualPanel label="%RH history" accent="cyan" className="min-h-[200px] flex-1">
          <WaveCanvas
            channels={[
              {
                color: "var(--accent-cyan)",
                gradFrom: "var(--accent-cyan)",
                gradTo: "transparent",
                data: linear(),
              },
            ]}
            min={20}
            max={90}
            lineWidth={2}
          />
        </PresentationVisualPanel>
        <div className="presentation-scene-overlay-layer pointer-events-none absolute inset-0">{hud}</div>
      </div>
    </DemoSlideLayout>
  );
}
