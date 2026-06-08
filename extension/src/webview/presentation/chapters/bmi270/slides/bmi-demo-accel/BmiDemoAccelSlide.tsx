import { useEffect, useRef } from "react";
import { Activity } from "lucide-react";
import { usePresentationBmi270 } from "../../../../app/usePresentationSensor";
import { DemoSlideLayout } from "../../../_shared/layouts/DemoSlideLayout";
import { LiveBar } from "../../../../widgets/LiveBar";
import { ValueDisplay } from "../../../../widgets/ValueDisplay";
import { WaveCanvas } from "../../../../widgets/WaveCanvas";
import { PresentationVisualPanel } from "../../../_shared/visual/PresentationVisualPanel";

const HISTORY = 200;

export default function BmiDemoAccelSlide() {
  const frame = usePresentationBmi270();
  const bufX = useRef(new Float32Array(HISTORY));
  const bufY = useRef(new Float32Array(HISTORY));
  const bufZ = useRef(new Float32Array(HISTORY));
  const head = useRef(0);

  useEffect(() => {
    bufX.current[head.current] = frame.ax;
    bufY.current[head.current] = frame.ay;
    bufZ.current[head.current] = frame.az;
    head.current = (head.current + 1) % HISTORY;
  }, [frame.ax, frame.ay, frame.az]);

  const makeLinear = (buf: Float32Array) => {
    const h = head.current;
    const out = new Float32Array(HISTORY);
    for (let i = 0; i < HISTORY; i++) {
      out[i] = buf[(h + i) % HISTORY];
    }
    return out;
  };

  const magnitude = Math.sqrt(frame.ax ** 2 + frame.ay ** 2 + frame.az ** 2);

  return (
    <DemoSlideLayout
      title="Accelerometer waveforms"
      subtitle="Tri-axis g + scrolling history from the live store."
      theoryStrip="Accelerometer measures specific force (g), not coordinate velocity."
      footer={`|a| ≈ 1.0 g at rest · magnitude now ${magnitude.toFixed(3)} g`}
    >
      <div className="flex h-full min-h-0 flex-col gap-4">
        <div className="flex items-center gap-2">
          <Activity size={18} strokeWidth={1.5} style={{ color: "var(--axis-x)" }} />
          <span className="text-2xs uppercase tracking-widest text-[var(--text-muted)]">Live tri-axis</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "aX", value: frame.ax, color: "var(--axis-x)" },
            { label: "aY", value: frame.ay, color: "var(--axis-y)" },
            { label: "aZ", value: frame.az, color: "var(--axis-z)" },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex flex-col gap-2">
              <ValueDisplay label={label} value={value} unit="g" color={color} decimals={4} />
              <LiveBar value={value} min={-2} max={2} color={color} height={8} />
            </div>
          ))}
        </div>
        <PresentationVisualPanel label="Waveform" accent="cyan" className="min-h-[140px] flex-1">
          <WaveCanvas
            channels={[
              {
                color: "var(--axis-x)",
                gradFrom: "var(--axis-x-grad-from)",
                gradTo: "var(--axis-x-grad-to)",
                data: makeLinear(bufX.current),
              },
              {
                color: "var(--axis-y)",
                gradFrom: "var(--axis-y-grad-from)",
                gradTo: "var(--axis-y-grad-to)",
                data: makeLinear(bufY.current),
              },
              {
                color: "var(--axis-z)",
                gradFrom: "var(--axis-z-grad-from)",
                gradTo: "var(--axis-z-grad-to)",
                data: makeLinear(bufZ.current),
              },
            ]}
            min={-2}
            max={2}
          />
        </PresentationVisualPanel>
      </div>
    </DemoSlideLayout>
  );
}
