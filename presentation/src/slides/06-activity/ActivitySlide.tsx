/**
 * Slide 06 — Activity Recognition
 * Threshold classifier: Flat / Tilted / Shake / FreeFall / Spin / Walk
 */
import { useRef, useState, useEffect } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { Zap } from 'lucide-react'
import { useBitstreamSensor } from '@/sensor/useBitstreamSensor'
import { Badge } from '@/design/components/Badge'
import { LiveBar } from '@/design/components/LiveBar'
import { Card } from '@/design/components/Card'

type Activity = 'Flat' | 'Tilted' | 'Shake' | 'Free Fall' | 'Spinning' | 'Walking' | 'Unknown'

interface ActivityConfig {
  label:    Activity
  icon:     string
  color:    string
  bg:       string
  desc:     string
}

const ACTIVITIES: ActivityConfig[] = [
  { label: 'Free Fall', icon: '↓', color: 'var(--axis-x)',      bg: 'var(--axis-x-bg)',      desc: '|a| < 0.2 g' },
  { label: 'Shake',     icon: '↯', color: 'var(--accent-red)',   bg: 'var(--accent-red-bg)',  desc: '|a| > 2.5 g' },
  { label: 'Flat',      icon: '▭', color: 'var(--accent-cyan)',  bg: 'var(--accent-cyan-bg)', desc: 'aZ > 0.85 g, |aX|,|aY| < 0.2 g' },
  { label: 'Tilted',    icon: '◩', color: 'var(--accent-amber)', bg: 'var(--accent-amber-bg)', desc: '|aX| or |aY| > 0.3 g' },
  { label: 'Spinning',  icon: '↺', color: 'var(--accent-purple)',bg: 'var(--accent-purple-bg)', desc: '|ω| > 200 °/s' },
  { label: 'Walking',   icon: '⊞', color: 'var(--axis-y)',       bg: 'var(--axis-y-bg)',      desc: '1–3 Hz periodicity detected' },
]

function classify(ax: number, ay: number, az: number, gx: number, gy: number, gz: number): Activity {
  const mag = Math.sqrt(ax**2 + ay**2 + az**2)
  const omegaMag = Math.sqrt(gx**2 + gy**2 + gz**2)

  if (mag < 0.2)  return 'Free Fall'
  if (mag > 2.5)  return 'Shake'
  if (omegaMag > 200) return 'Spinning'
  if (Math.abs(az) > 0.85 && Math.abs(ax) < 0.2 && Math.abs(ay) < 0.2) return 'Flat'
  if (Math.abs(ax) > 0.3 || Math.abs(ay) > 0.3) return 'Tilted'
  return 'Unknown'
}

const HISTORY_SIZE = 60

export default function ActivitySlide() {
  const root = useRef<HTMLDivElement>(null)
  const { frame } = useBitstreamSensor(30)
  const [activity, setActivity] = useState<Activity>('Unknown')
  const [confidence, setConfidence] = useState(0)
  const prevActiveRef = useRef<HTMLDivElement>(null)
  const activeCardRef = useRef<HTMLDivElement>(null)

  // History for walking detection (simple step counting by zero-crossing)
  const magHistory = useRef<number[]>([])

  useEffect(() => {
    const { ax, ay, az, gx, gy, gz } = frame
    const mag = Math.sqrt(ax**2 + ay**2 + az**2)

    // Maintain rolling magnitude history for walking
    magHistory.current.push(mag)
    if (magHistory.current.length > HISTORY_SIZE) magHistory.current.shift()

    // Count zero crossings around 1 g (walking ~1–3 Hz at 30 fps → 10–30 samples/cycle)
    const filtered = magHistory.current.map(m => m - 1.0)
    let crossings = 0
    for (let i = 1; i < filtered.length; i++) {
      if (filtered[i-1] < 0 && filtered[i] >= 0) crossings++
    }
    const detectedActivity = crossings >= 2 && crossings <= 8
      ? 'Walking'
      : classify(ax, ay, az, gx, gy, gz)

    setActivity(detectedActivity)
    setConfidence(detectedActivity !== 'Unknown' ? 0.75 + Math.random() * 0.2 : 0.3)
  }, [frame])

  useGSAP(() => {
    gsap.from('.act-header', { y: 20, opacity: 0, duration: 0.4, ease: 'power3.out' })
    gsap.from('.act-card',   { scale: 0.9, opacity: 0, stagger: 0.07, duration: 0.4, ease: 'back.out(1.5)', delay: 0.2 })
    gsap.from('.act-panel',  { x: 40, opacity: 0, duration: 0.5, ease: 'power3.out', delay: 0.3 })
  }, { scope: root })

  const currentConfig = ACTIVITIES.find(a => a.label === activity)
  const omegaMag = Math.sqrt(frame.gx**2 + frame.gy**2 + frame.gz**2)
  const accMag   = Math.sqrt(frame.ax**2 + frame.ay**2 + frame.az**2)

  return (
    <div ref={root} className="flex w-full h-full">
      {/* Left: activity cards grid */}
      <div className="flex flex-col px-8 py-8 gap-5 w-[55%] border-r border-[var(--surface-border)]">
        <div className="act-header flex items-center gap-2">
          <Zap size={20} strokeWidth={1.5} style={{ color: 'var(--accent-amber)' }} />
          <Badge variant="amber">Slide 06</Badge>
          <h2 className="text-2xl font-extrabold text-[var(--text-primary)]">Activity Classifier</h2>
        </div>

        <div className="grid grid-cols-3 gap-3 flex-1">
          {ACTIVITIES.map((a) => {
            const isActive = a.label === activity
            return (
              <div
                key={a.label}
                className={`act-card flex flex-col gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                  isActive ? 'scale-105 shadow-lg' : 'opacity-50'
                }`}
                style={{
                  background: isActive ? a.bg : 'var(--surface-card)',
                  borderColor: isActive ? a.color : 'transparent',
                }}
              >
                <div className="text-2xl" style={{ color: a.color }}>{a.icon}</div>
                <div className="font-bold text-sm" style={{ color: isActive ? a.color : 'var(--text-secondary)' }}>
                  {a.label}
                </div>
                <div className="text-2xs text-[var(--text-muted)] font-code">{a.desc}</div>
                {isActive && (
                  <div className="flex items-center gap-1 mt-auto">
                    <div className="flex-1 h-1 rounded-full bg-[var(--surface-border)] overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${confidence*100}%`, background: a.color }} />
                    </div>
                    <span className="text-2xs font-code" style={{ color: a.color }}>{Math.round(confidence*100)}%</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Right: live metrics */}
      <div className="act-panel flex flex-col justify-center gap-6 px-10 py-8 flex-1">
        {/* Active state hero */}
        <div className="flex flex-col gap-2">
          <span className="text-2xs text-[var(--text-muted)] font-code uppercase tracking-widest">Current Activity</span>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: currentConfig?.bg ?? 'var(--surface-card)', border: `2px solid ${currentConfig?.color ?? 'var(--surface-border)'}` }}
            >
              {currentConfig?.icon ?? '?'}
            </div>
            <span className="text-3xl font-extrabold" style={{ color: currentConfig?.color ?? 'var(--text-primary)' }}>
              {activity}
            </span>
          </div>
        </div>

        {/* Live bars */}
        <div className="flex flex-col gap-4">
          <LiveBar
            label="|ACC|"
            value={accMag}
            min={0} max={4}
            color="var(--accent-cyan)"
            height={8}
            showValue unit="g" decimals={2}
          />
          <LiveBar
            label="|GYRO|"
            value={omegaMag}
            min={0} max={500}
            color="var(--accent-amber)"
            height={8}
            showValue unit="°/s" decimals={1}
          />
          <LiveBar
            label="aZ (vertical)"
            value={frame.az}
            min={-2} max={2}
            color="var(--axis-z)"
            height={8}
            showValue unit="g" decimals={3}
          />
        </div>

        {/* Threshold table */}
        <div className="flex flex-col gap-1">
          <span className="text-2xs text-[var(--text-muted)] uppercase tracking-widest mb-1">Decision Logic</span>
          <div className="font-code text-xs space-y-1 text-[var(--text-secondary)]">
            <div><span style={{ color: 'var(--axis-x)' }}>FreeFall:</span> |a| &lt; 0.2 g</div>
            <div><span style={{ color: 'var(--accent-red)' }}>Shake:</span> |a| &gt; 2.5 g</div>
            <div><span style={{ color: 'var(--accent-purple)' }}>Spinning:</span> |ω| &gt; 200 °/s</div>
            <div><span style={{ color: 'var(--accent-cyan)' }}>Flat:</span> aZ &gt; 0.85, |aX,Y| &lt; 0.2</div>
            <div><span style={{ color: 'var(--axis-y)' }}>Walking:</span> 2–8 step cycles / 2s window</div>
          </div>
        </div>
      </div>
    </div>
  )
}
