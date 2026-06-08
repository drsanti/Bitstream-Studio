/**
 * Slide 01 — BMI270 IMU Overview
 * Hero intro with animated axis pills, live temp, key specs.
 */
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { Cpu, Thermometer, Zap, BarChart3 } from 'lucide-react'
import { useBitstreamSensor } from '@/sensor/useBitstreamSensor'
import { Badge } from '@/design/components/Badge'
import { Card } from '@/design/components/Card'

gsap.registerPlugin()

export default function IntroSlide() {
  const root = useRef<HTMLDivElement>(null)
  const { frame } = useBitstreamSensor(10)

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.from('.intro-eyebrow',   { y: 16, opacity: 0, duration: 0.4 })
      .from('.intro-title',     { y: 24, opacity: 0, duration: 0.55 }, '-=0.2')
      .from('.intro-subtitle',  { y: 16, opacity: 0, duration: 0.4 }, '-=0.25')
      .from('.intro-divider',   { scaleX: 0, opacity: 0, duration: 0.5 }, '-=0.2')
      .from('.axis-pill',       { y: 12, opacity: 0, stagger: 0.1, duration: 0.35 }, '-=0.2')
      .from('.spec-card',       { y: 20, opacity: 0, stagger: 0.08, duration: 0.4 }, '-=0.25')
  }, { scope: root })

  return (
    <div ref={root} className="flex flex-col items-center justify-center w-full h-full gap-8 px-12 py-8">
      {/* Hero */}
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="intro-eyebrow flex items-center gap-2">
          <Badge variant="cyan" dot>Bosch Sensortec</Badge>
          <Badge variant="muted">6-DoF IMU</Badge>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-[var(--accent-cyan-bg)] border border-[var(--accent-cyan)] border-opacity-30 flex items-center justify-center">
            <Cpu size={28} strokeWidth={1.5} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <h1 className="intro-title text-6xl font-extrabold tracking-tight text-[var(--text-primary)]">
            BMI<span style={{ color: 'var(--accent-cyan)' }}>270</span>
          </h1>
        </div>

        <p className="intro-subtitle text-xl text-[var(--text-secondary)] max-w-lg">
          Inertial Measurement Unit — Accelerometer + Gyroscope in a single 2.5 × 3.0 mm package
        </p>

        {/* Divider */}
        <div className="intro-divider w-24 h-px bg-[var(--surface-border)]" />

        {/* Axis pills */}
        <div className="flex gap-3">
          {[
            { label: 'X Axis', color: 'var(--axis-x)', bg: 'var(--axis-x-bg)' },
            { label: 'Y Axis', color: 'var(--axis-y)', bg: 'var(--axis-y-bg)' },
            { label: 'Z Axis', color: 'var(--axis-z)', bg: 'var(--axis-z-bg)' },
          ].map(({ label, color, bg }) => (
            <div
              key={label}
              className="axis-pill flex items-center gap-2 px-4 py-1.5 rounded-full border"
              style={{ background: bg, borderColor: color + '55' }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
              <span className="text-xs font-bold font-code" style={{ color }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Spec cards */}
      <div className="grid grid-cols-4 gap-4 w-full max-w-3xl">
        <SpecCard
          icon={<BarChart3 size={18} strokeWidth={1.5} style={{ color: 'var(--axis-x)' }} />}
          label="Accel Range"
          value="±2/4/8/16 g"
          accent="var(--axis-x)"
        />
        <SpecCard
          icon={<BarChart3 size={18} strokeWidth={1.5} style={{ color: 'var(--axis-y)' }} />}
          label="Gyro Range"
          value="±2000 °/s"
          accent="var(--axis-y)"
        />
        <SpecCard
          icon={<Zap size={18} strokeWidth={1.5} style={{ color: 'var(--accent-amber)' }} />}
          label="ODR"
          value="up to 1600 Hz"
          accent="var(--accent-amber)"
        />
        <SpecCard
          icon={<Thermometer size={18} strokeWidth={1.5} style={{ color: 'var(--accent-purple)' }} />}
          label="Temperature"
          value={frame.tempValid ? `${frame.temp.toFixed(1)} °C` : '-- °C'}
          accent="var(--accent-purple)"
          live={frame.tempValid}
        />
      </div>

      {/* Keyboard hint */}
      <p className="text-2xs text-[var(--text-muted)] font-code">
        ← → arrow keys to navigate · S speaker notes · F fullscreen
      </p>
    </div>
  )
}

function SpecCard({ icon, label, value, accent, live }: {
  icon: React.ReactNode
  label: string
  value: string
  accent: string
  live?: boolean
}) {
  return (
    <Card className="spec-card flex flex-col gap-2" accent={accent}>
      <div className="flex items-center justify-between">
        {icon}
        {live && <div className="w-1.5 h-1.5 rounded-full bg-[var(--status-live)] animate-pulse" />}
      </div>
      <div>
        <div className="text-2xs font-semibold tracking-widest uppercase text-[var(--text-muted)]">{label}</div>
        <div className="text-sm font-bold font-code text-[var(--text-primary)] mt-0.5">{value}</div>
      </div>
    </Card>
  )
}
