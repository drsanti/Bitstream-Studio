/**
 * Slide 04 — MEMS Sensing
 * Animated SVG proof-mass diagram (GSAP driven) + educational prose.
 */
import { useRef, useEffect } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { Microscope } from 'lucide-react'
import { useBitstreamSensor } from '@/sensor/useBitstreamSensor'
import { Badge } from '@/design/components/Badge'

// Proof-mass SVG constants
const W = 400; const H = 280
const MASS_W = 100; const MASS_H = 60
const FINGER_W = 8; const FINGER_H = 28; const FINGER_GAP = 16
const N_FINGERS = 5

export default function MEMSSlide() {
  const root = useRef<HTMLDivElement>(null)
  const massRef = useRef<SVGRectElement>(null)
  const fingersRef = useRef<SVGGElement>(null)
  const cap1TextRef = useRef<SVGTextElement>(null)
  const cap2TextRef = useRef<SVGTextElement>(null)
  const { frame } = useBitstreamSensor(60)

  // Drive proof-mass displacement from live aX (±1 g → ±35 px)
  useEffect(() => {
    const displacement = frame.ax * 35  // px
    gsap.to(massRef.current, { x: displacement, duration: 0.12, ease: 'power2.out' })
    gsap.to(fingersRef.current, { x: displacement, duration: 0.12, ease: 'power2.out' })
    const c1 = FINGER_GAP / 2 - displacement * 0.4
    const c2 = FINGER_GAP / 2 + displacement * 0.4
    if (cap1TextRef.current) cap1TextRef.current.textContent = `C1: ${c1.toFixed(1)} fF`
    if (cap2TextRef.current) cap2TextRef.current.textContent = `C2: ${c2.toFixed(1)} fF`
  }, [frame.ax])

  useGSAP(() => {
    gsap.from('.mems-header', { y: 20, opacity: 0, duration: 0.4, ease: 'power3.out' })
    gsap.from('.mems-svg',    { scale: 0.95, opacity: 0, duration: 0.5, ease: 'back.out(1.5)', delay: 0.2 })
    gsap.from('.mems-prose',  { x: 30, opacity: 0, duration: 0.5, ease: 'power3.out', delay: 0.3 })
  }, { scope: root })

  const cx = W / 2; const cy = H / 2

  // Fixed fingers (anchored to substrate)
  const fixedFingers: JSX.Element[] = []
  const mobileFingers: JSX.Element[] = []
  for (let i = 0; i < N_FINGERS; i++) {
    const fx = cx - (N_FINGERS / 2 - i) * (FINGER_W + FINGER_GAP) - MASS_W / 2 - FINGER_W
    // Upper fixed fingers (above mass)
    fixedFingers.push(
      <rect key={`uf${i}`} x={fx + (N_FINGERS / 2 - i) * (FINGER_W + FINGER_GAP) + cx / 2} y={cy - MASS_H / 2 - FINGER_H - 2} width={FINGER_W} height={FINGER_H} rx={2} fill="#60A5FA" opacity={0.7} />,
      <rect key={`lf${i}`} x={fx + (N_FINGERS / 2 - i) * (FINGER_W + FINGER_GAP) + cx / 2} y={cy + MASS_H / 2 + 2} width={FINGER_W} height={FINGER_H} rx={2} fill="#60A5FA" opacity={0.7} />
    )
    // Mobile fingers attached to mass
    mobileFingers.push(
      <rect key={`um${i}`} x={fx + (N_FINGERS / 2 - i) * (FINGER_W + FINGER_GAP) + cx / 2} y={cy - MASS_H / 2 - FINGER_H / 2} width={FINGER_W} height={FINGER_H} rx={2} fill="#F87171" opacity={0.85} />,
      <rect key={`lm${i}`} x={fx + (N_FINGERS / 2 - i) * (FINGER_W + FINGER_GAP) + cx / 2} y={cy + MASS_H / 2 - FINGER_H / 2} width={FINGER_W} height={FINGER_H} rx={2} fill="#F87171" opacity={0.85} />
    )
  }

  return (
    <div ref={root} className="flex w-full h-full gap-0">
      {/* Left: animated SVG */}
      <div className="flex flex-col items-center justify-center gap-4 w-[55%] px-8 py-8 border-r border-[var(--surface-border)]">
        <div className="mems-header flex items-center gap-2 self-start">
          <Microscope size={20} strokeWidth={1.5} style={{ color: 'var(--accent-cyan)' }} />
          <Badge variant="cyan">Slide 04</Badge>
          <h2 className="text-2xl font-extrabold text-[var(--text-primary)]">MEMS Proof-Mass</h2>
        </div>

        <div className="mems-svg">
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            {/* Substrate */}
            <rect x={20} y={20} width={W-40} height={H-40} rx={8} fill="var(--surface-card)" stroke="var(--surface-border)" strokeWidth={1} />

            {/* Springs */}
            <line x1={cx - MASS_W/2} y1={cy} x2={30} y2={cy} stroke="var(--surface-border)" strokeWidth={3} strokeDasharray="6 4" />
            <line x1={cx + MASS_W/2} y1={cy} x2={W-30} y2={cy} stroke="var(--surface-border)" strokeWidth={3} strokeDasharray="6 4" />
            <text x={35} y={cy-8} fontSize={9} fill="var(--text-muted)" fontFamily="monospace">spring</text>
            <text x={W-70} y={cy-8} fontSize={9} fill="var(--text-muted)" fontFamily="monospace">spring</text>

            {/* Fixed fingers */}
            <g>{fixedFingers}</g>

            {/* Proof mass + mobile fingers (animated group) */}
            <g ref={fingersRef}>{mobileFingers}</g>
            <rect
              ref={massRef}
              x={cx - MASS_W/2}
              y={cy - MASS_H/2}
              width={MASS_W}
              height={MASS_H}
              rx={6}
              fill="var(--accent-amber-bg)"
              stroke="var(--accent-amber)"
              strokeWidth={2}
            />
            <text x={cx} y={cy+5} textAnchor="middle" fontSize={11} fontWeight="700" fill="var(--accent-amber)" fontFamily="monospace">MASS</text>

            {/* Capacitance labels */}
            <text ref={cap1TextRef} x={cx - MASS_W} y={H-30} textAnchor="middle" fontSize={10} fill="var(--axis-z)" fontFamily="monospace">C1: 8.0 fF</text>
            <text ref={cap2TextRef} x={cx + MASS_W} y={H-30} textAnchor="middle" fontSize={10} fill="var(--axis-x)" fontFamily="monospace">C2: 8.0 fF</text>

            {/* Electrode labels */}
            <text x={65} y={cy - MASS_H/2 - FINGER_H - 8} fontSize={9} fill="#60A5FA" fontFamily="monospace">Fixed electrodes</text>
            <text x={cx - 30} y={cy - MASS_H - 10} fontSize={9} fill="#F87171" fontFamily="monospace">Mobile (mass)</text>

            {/* Axis label */}
            <text x={cx} y={H-6} textAnchor="middle" fontSize={9} fill="var(--text-muted)" fontFamily="monospace">
              Sensing axis: X → displacement drives ΔC = C1 − C2
            </text>
          </svg>
        </div>

        <div className="text-xs text-[var(--text-muted)] font-code text-center max-w-xs">
          Diagram reacts to live aX. Tilt the board along X to see the proof-mass displace.
        </div>
      </div>

      {/* Right: prose */}
      <div className="mems-prose flex flex-col justify-center gap-5 px-10 py-8 flex-1">
        <h3 className="text-xl font-bold text-[var(--text-primary)]">How MEMS Capacitive Sensing Works</h3>

        <div className="space-y-4 text-sm text-[var(--text-secondary)] leading-relaxed">
          <p>
            The <strong style={{ color: 'var(--accent-amber)' }}>proof mass</strong> is a tiny silicon structure suspended by folded-beam springs. It can only move along the sensing axis.
          </p>
          <p>
            <strong style={{ color: 'var(--axis-x)' }}>Mobile fingers</strong> interleave with <strong style={{ color: 'var(--axis-z)' }}>fixed electrode fingers</strong>. Together they form two differential capacitors: <span className="font-code text-xs" style={{ color: 'var(--axis-z)' }}>C1</span> and <span className="font-code text-xs" style={{ color: 'var(--axis-x)' }}>C2</span>.
          </p>
          <p>
            When acceleration displaces the mass, <code className="text-xs font-code" style={{ color: 'var(--accent-cyan)' }}>ΔC = C1 − C2</code> changes proportionally. A Σ-Δ ADC converts this differential capacitance to a digital value.
          </p>
          <p>
            The same principle applies to the <strong style={{ color: 'var(--accent-purple)' }}>gyroscope</strong>, but uses Coriolis force on a resonating mass instead of direct displacement.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-2">
          {[
            ['Proof mass', '~0.1 µg', 'var(--accent-amber)'],
            ['Finger gap', '~2 µm', 'var(--axis-x)'],
            ['Capacitance', '~10 fF', 'var(--axis-z)'],
            ['Sensitivity', '0.4 fF/g', 'var(--accent-purple)'],
          ].map(([k, v, c]) => (
            <div key={k} className="flex flex-col gap-0.5 rounded-lg p-3 bg-[var(--surface-card)] border border-[var(--surface-border)]">
              <span className="text-2xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">{k}</span>
              <span className="text-sm font-bold font-code" style={{ color: c }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
