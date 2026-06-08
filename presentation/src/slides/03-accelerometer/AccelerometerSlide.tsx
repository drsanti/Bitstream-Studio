/**
 * Slide 03 — Accelerometer
 * Live waveform + tri-axis values + gravity explanation diagram.
 */
import { useRef, useEffect } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { Activity } from 'lucide-react'
import { useBitstreamSensor } from '@/sensor/useBitstreamSensor'
import { ValueDisplay } from '@/design/components/ValueDisplay'
import { LiveBar } from '@/design/components/LiveBar'
import { WaveCanvas } from '@/design/components/WaveCanvas'
import { Badge } from '@/design/components/Badge'
import { Card } from '@/design/components/Card'

const HISTORY = 200

export default function AccelerometerSlide() {
  const root = useRef<HTMLDivElement>(null)
  const { frame } = useBitstreamSensor(60)

  // Circular history buffers
  const bufX = useRef(new Float32Array(HISTORY))
  const bufY = useRef(new Float32Array(HISTORY))
  const bufZ = useRef(new Float32Array(HISTORY))
  const head = useRef(0)

  useEffect(() => {
    bufX.current[head.current] = frame.ax
    bufY.current[head.current] = frame.ay
    bufZ.current[head.current] = frame.az
    head.current = (head.current + 1) % HISTORY
  }, [frame])

  // Arrange as linear array from oldest → newest
  const makeLinear = (buf: Float32Array) => {
    const h = head.current
    const out = new Float32Array(HISTORY)
    for (let i = 0; i < HISTORY; i++) out[i] = buf[(h + i) % HISTORY]
    return out
  }

  useGSAP(() => {
    gsap.from('.acc-header', { y: 20, opacity: 0, duration: 0.4, ease: 'power3.out' })
    gsap.from('.acc-value',  { scale: 0.9, opacity: 0, stagger: 0.08, duration: 0.4, ease: 'back.out(2)', delay: 0.2 })
    gsap.from('.acc-wave',   { y: 30, opacity: 0, duration: 0.5, ease: 'power3.out', delay: 0.3 })
    gsap.from('.acc-card',   { y: 20, opacity: 0, stagger: 0.1, duration: 0.4, ease: 'power3.out', delay: 0.4 })
  }, { scope: root })

  const magnitude = Math.sqrt(frame.ax**2 + frame.ay**2 + frame.az**2)

  return (
    <div ref={root} className="flex flex-col w-full h-full px-10 py-8 gap-6">
      {/* Header */}
      <div className="acc-header flex items-center gap-3">
        <Activity size={22} strokeWidth={1.5} style={{ color: 'var(--axis-x)' }} />
        <div>
          <Badge variant="cyan">Slide 03</Badge>
          <h2 className="text-3xl font-extrabold text-[var(--text-primary)] mt-1">Accelerometer</h2>
        </div>
        <div className="ml-auto flex flex-col items-end">
          <span className="text-2xs text-[var(--text-muted)] font-code uppercase">|a| magnitude</span>
          <span className="text-2xl font-bold font-code" style={{ color: 'var(--accent-cyan)' }}>
            {magnitude.toFixed(3)} g
          </span>
        </div>
      </div>

      {/* Live values + bars */}
      <div className="flex gap-8 items-start">
        {[
          { label: 'aX', key: 'ax', value: frame.ax, color: 'var(--axis-x)' },
          { label: 'aY', key: 'ay', value: frame.ay, color: 'var(--axis-y)' },
          { label: 'aZ', key: 'az', value: frame.az, color: 'var(--axis-z)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="acc-value flex-1 flex flex-col gap-2">
            <ValueDisplay label={label} value={value} unit="g" color={color} decimals={4} />
            <LiveBar value={value} min={-2} max={2} color={color} height={8} />
          </div>
        ))}
      </div>

      {/* Waveform */}
      <div className="acc-wave flex-1 min-h-0 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xs text-[var(--text-muted)] font-code uppercase tracking-widest">Live Waveform</span>
          <div className="flex gap-3">
            {[['X','var(--axis-x)'],['Y','var(--axis-y)'],['Z','var(--axis-z)']].map(([l,c]) => (
              <div key={l} className="flex items-center gap-1">
                <div className="w-3 h-0.5 rounded" style={{ background: c }} />
                <span className="text-2xs font-code" style={{ color: c }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-[var(--surface-border)] bg-[var(--surface-card)]">
          <WaveCanvas
            channels={[
              { color: 'var(--axis-x)', gradFrom: 'var(--axis-x-grad-from)', gradTo: 'var(--axis-x-grad-to)', data: makeLinear(bufX.current) },
              { color: 'var(--axis-y)', gradFrom: 'var(--axis-y-grad-from)', gradTo: 'var(--axis-y-grad-to)', data: makeLinear(bufY.current) },
              { color: 'var(--axis-z)', gradFrom: 'var(--axis-z-grad-from)', gradTo: 'var(--axis-z-grad-to)', data: makeLinear(bufZ.current) },
            ]}
            width={800}
            height={160}
            min={-2}
            max={2}
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Concept cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="acc-card" accent="var(--axis-z)">
          <div className="text-2xs font-semibold uppercase text-[var(--text-muted)] mb-1">Flat on Table</div>
          <div className="font-code text-sm" style={{ color: 'var(--axis-z)' }}>aZ = +1.0 g</div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">Reaction force from surface balances gravity</div>
        </Card>
        <Card className="acc-card" accent="var(--axis-x)">
          <div className="text-2xs font-semibold uppercase text-[var(--text-muted)] mb-1">Free Fall</div>
          <div className="font-code text-sm" style={{ color: 'var(--axis-x)' }}>|a| = 0.0 g</div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">No contact force — all axes read zero</div>
        </Card>
        <Card className="acc-card" accent="var(--accent-amber)">
          <div className="text-2xs font-semibold uppercase text-[var(--text-muted)] mb-1">Full Scale</div>
          <div className="font-code text-sm" style={{ color: 'var(--accent-amber)' }}>±2 / 4 / 8 / 16 g</div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">Lower range → finer LSB resolution</div>
        </Card>
      </div>
    </div>
  )
}
