/**
 * Slide 07 — Sensor Configuration
 * Interactive range/ODR selector + write to firmware via configWriter.
 */
import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { Settings2, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { useBitstreamSensor } from '@/sensor/useBitstreamSensor'
import {
  writeConfig, type BMI270Config,
  ACC_RANGES, ACC_ODRS, GYR_RANGES, GYR_ODRS,
} from '@/sensor/configWriter'
import { Badge } from '@/design/components/Badge'
import { ValueDisplay } from '@/design/components/ValueDisplay'

type WriteStatus = 'idle' | 'writing' | 'ok' | 'error'

export default function ConfigSlide() {
  const root = useRef<HTMLDivElement>(null)
  const { frame } = useBitstreamSensor(10)
  const [config, setConfig] = useState<BMI270Config>({ accRange: 4, accOdr: 100, gyrRange: 500, gyrOdr: 100 })
  const [status, setStatus]  = useState<WriteStatus>('idle')
  const [message, setMessage] = useState('')

  const handleWrite = async () => {
    setStatus('writing')
    setMessage('Sending configuration to firmware…')
    const result = await writeConfig(config)
    if (result.ok) {
      setStatus('ok')
      setMessage('Configuration written successfully.')
    } else {
      setStatus('error')
      setMessage(result.error ?? 'Unknown error')
    }
    setTimeout(() => setStatus('idle'), 4000)
  }

  useGSAP(() => {
    gsap.from('.cfg-header',  { y: 20, opacity: 0, duration: 0.4, ease: 'power3.out' })
    gsap.from('.cfg-section', { y: 20, opacity: 0, stagger: 0.12, duration: 0.4, ease: 'power3.out', delay: 0.2 })
    gsap.from('.cfg-live',    { x: 40, opacity: 0, duration: 0.5, ease: 'power3.out', delay: 0.3 })
  }, { scope: root })

  // Derived resolution info
  const accResolution = (config.accRange * 2) / 65536 * 1000   // mg/LSB
  const gyrResolution = (config.gyrRange * 2) / 65536           // °/s/LSB

  return (
    <div ref={root} className="flex w-full h-full">
      {/* Config panel */}
      <div className="flex flex-col gap-6 px-8 py-8 w-[55%] border-r border-[var(--surface-border)] overflow-y-auto">
        <div className="cfg-header flex items-center gap-2">
          <Settings2 size={20} strokeWidth={1.5} style={{ color: 'var(--accent-cyan)' }} />
          <Badge variant="cyan">Slide 07</Badge>
          <h2 className="text-2xl font-extrabold text-[var(--text-primary)]">Sensor Configuration</h2>
        </div>

        {/* Accelerometer config */}
        <section className="cfg-section flex flex-col gap-4">
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--axis-x)' }}>
            Accelerometer
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <SelectGroup
              label="Full-Scale Range"
              options={ACC_RANGES.map(r => ({ value: r, label: `±${r} g` }))}
              value={config.accRange}
              onChange={(v) => setConfig(c => ({ ...c, accRange: v as BMI270Config['accRange'] }))}
              color="var(--axis-x)"
            />
            <SelectGroup
              label="Output Data Rate"
              options={ACC_ODRS.map(r => ({ value: r, label: `${r} Hz` }))}
              value={config.accOdr}
              onChange={(v) => setConfig(c => ({ ...c, accOdr: v as BMI270Config['accOdr'] }))}
              color="var(--axis-x)"
            />
          </div>
          <div className="text-xs font-code text-[var(--text-muted)]">
            Resolution: <span style={{ color: 'var(--axis-x)' }}>{accResolution.toFixed(3)} mg/LSB</span>
          </div>
        </section>

        {/* Gyroscope config */}
        <section className="cfg-section flex flex-col gap-4">
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--axis-y)' }}>
            Gyroscope
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <SelectGroup
              label="Full-Scale Range"
              options={GYR_RANGES.map(r => ({ value: r, label: `±${r} °/s` }))}
              value={config.gyrRange}
              onChange={(v) => setConfig(c => ({ ...c, gyrRange: v as BMI270Config['gyrRange'] }))}
              color="var(--axis-y)"
            />
            <SelectGroup
              label="Output Data Rate"
              options={GYR_ODRS.map(r => ({ value: r, label: `${r} Hz` }))}
              value={config.gyrOdr}
              onChange={(v) => setConfig(c => ({ ...c, gyrOdr: v as BMI270Config['gyrOdr'] }))}
              color="var(--axis-y)"
            />
          </div>
          <div className="text-xs font-code text-[var(--text-muted)]">
            Resolution: <span style={{ color: 'var(--axis-y)' }}>{gyrResolution.toFixed(4)} °/s/LSB</span>
          </div>
        </section>

        {/* Write button */}
        <div className="cfg-section flex flex-col gap-3">
          <button
            onClick={handleWrite}
            disabled={status === 'writing'}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: status === 'ok' ? 'var(--accent-green-bg)' : status === 'error' ? 'var(--accent-red-bg)' : 'var(--accent-cyan-bg)',
              color:      status === 'ok' ? 'var(--accent-green)'    : status === 'error' ? 'var(--accent-red)'    : 'var(--accent-cyan)',
              border:     `1px solid ${status === 'ok' ? 'var(--accent-green)' : status === 'error' ? 'var(--accent-red)' : 'var(--accent-cyan)'}`,
            }}
          >
            {status === 'writing' && <Loader2 size={15} strokeWidth={2} className="animate-spin" />}
            {status === 'ok'      && <CheckCircle2 size={15} strokeWidth={2} />}
            {status === 'error'   && <AlertCircle size={15} strokeWidth={2} />}
            {status === 'idle'    && <Send size={15} strokeWidth={2} />}
            {status === 'writing' ? 'Writing…' : status === 'ok' ? 'Written!' : status === 'error' ? 'Failed' : 'Write to Firmware'}
          </button>
          {message && (
            <p className="text-xs font-code text-center" style={{ color: status === 'ok' ? 'var(--accent-green)' : status === 'error' ? 'var(--accent-red)' : 'var(--text-muted)' }}>
              {message}
            </p>
          )}
        </div>
      </div>

      {/* Live feedback */}
      <div className="cfg-live flex flex-col justify-center gap-6 px-10 py-8 flex-1">
        <h3 className="text-lg font-bold text-[var(--text-primary)]">Live Readings</h3>
        <p className="text-xs text-[var(--text-secondary)]">
          After writing, observe the accelerometer and gyroscope behavior change at the new range/rate.
        </p>
        <div className="grid grid-cols-2 gap-5">
          <ValueDisplay label="aX" value={frame.ax} unit="g" color="var(--axis-x)" />
          <ValueDisplay label="aY" value={frame.ay} unit="g" color="var(--axis-y)" />
          <ValueDisplay label="aZ" value={frame.az} unit="g" color="var(--axis-z)" />
          <ValueDisplay label="ωX" value={frame.gx} unit="°/s" color="var(--axis-x)" decimals={1} />
          <ValueDisplay label="ωY" value={frame.gy} unit="°/s" color="var(--axis-y)" decimals={1} />
          <ValueDisplay label="ωZ" value={frame.gz} unit="°/s" color="var(--axis-z)" decimals={1} />
        </div>

        {/* Config payload preview */}
        <div className="rounded-lg bg-[var(--surface-card)] border border-[var(--surface-border)] p-4">
          <div className="text-2xs text-[var(--text-muted)] uppercase tracking-wider mb-2">REQ payload → bitstream2/req</div>
          <pre className="text-xs font-code text-[var(--accent-cyan)]">
{JSON.stringify({ cmd: 'setConfig', sensorId: 0, config }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}

function SelectGroup<T extends number>({
  label, options, value, onChange, color,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  color: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-2xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="px-2.5 py-1 rounded text-xs font-code transition-all duration-150"
            style={{
              background: opt.value === value ? `${color}22` : 'var(--surface-hover)',
              color:      opt.value === value ? color : 'var(--text-muted)',
              border:     `1px solid ${opt.value === value ? color : 'transparent'}`,
              fontWeight: opt.value === value ? 700 : 400,
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
