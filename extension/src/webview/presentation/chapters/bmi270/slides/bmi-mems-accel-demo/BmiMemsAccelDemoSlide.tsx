import { usePresentationBmi270 } from "../../../../app/usePresentationSensor";
import { DemoSlideLayout } from "../../../_shared/layouts/DemoSlideLayout";

export default function BmiMemsAccelDemoSlide() {
  const frame = usePresentationBmi270();
  const displacement = Math.max(-40, Math.min(40, frame.ax * 35));

  return (
    <DemoSlideLayout
      title="MEMS proof-mass (live aX)"
      subtitle="Capacitive sensing — differential C1 − C2 tracks mass displacement."
      theoryStrip="Proof mass moves along the sensing axis; finger overlap changes capacitance."
      footer="Tilt the board along X to move the mass in the diagram."
    >
      <div className="flex h-full flex-col items-center justify-center gap-6 md:flex-row">
        <svg width={360} height={220} viewBox="0 0 360 220" className="shrink-0">
          <rect
            x={24}
            y={24}
            width={312}
            height={172}
            rx={8}
            fill="var(--surface-card)"
            stroke="var(--surface-border)"
          />
          <line x1={40} y1={110} x2={120} y2={110} stroke="var(--surface-border)" strokeWidth={3} strokeDasharray="6 4" />
          <line x1={240} y1={110} x2={320} y2={110} stroke="var(--surface-border)" strokeWidth={3} strokeDasharray="6 4" />
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={`f${i}`}
              x={130 + i * 22}
              y={72}
              width={8}
              height={24}
              rx={2}
              fill="#60A5FA"
              opacity={0.7}
            />
          ))}
          <g style={{ transform: `translateX(${displacement}px)`, transition: "transform 120ms ease-out" }}>
            <rect x={150} y={88} width={80} height={44} rx={6} fill="var(--accent-amber-bg)" stroke="var(--accent-amber)" strokeWidth={2} />
            <text x={190} y={114} textAnchor="middle" fontSize={11} fontWeight="700" fill="var(--accent-amber)">
              MASS
            </text>
            {[0, 1, 2, 3].map((i) => (
              <rect key={`m${i}`} x={132 + i * 22} y={98} width={8} height={24} rx={2} fill="#F87171" opacity={0.85} />
            ))}
          </g>
          <text x={180} y={200} textAnchor="middle" fontSize={10} fill="var(--text-muted)">
            aX = {frame.ax.toFixed(3)} g → displacement
          </text>
        </svg>
        <div className="max-w-sm space-y-3 text-sm leading-relaxed text-[var(--text-secondary)]">
          <p>
            Mobile fingers on the proof mass interleave with fixed electrodes. Acceleration along X shifts overlap
            between <span style={{ color: "var(--axis-z)" }}>C1</span> and{" "}
            <span style={{ color: "var(--axis-x)" }}>C2</span>.
          </p>
          <p>A Σ-Δ ADC converts ΔC into the digital accel samples you see in the waveform demo.</p>
        </div>
      </div>
    </DemoSlideLayout>
  );
}
