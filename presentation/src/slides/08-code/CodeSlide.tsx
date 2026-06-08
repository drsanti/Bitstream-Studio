/**
 * Slide 08 — Code & Protocol
 * Data flow diagram + Shiki-highlighted code snippets (firmware C + host TS).
 */
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { Code2, ArrowRight } from 'lucide-react'
import { Badge } from '@/design/components/Badge'
import { MarkdownRenderer } from '@/design/components/MarkdownRenderer'

const FIRMWARE_C = `\`\`\`c
// BMI270 — read ACC + GYR over SPI (Zephyr RTOS)
static int bmi270_read_frame(struct bmi270_data *d) {
    uint8_t buf[12];
    spi_read_reg(BMI270_REG_ACC_X_LSB, buf, 12);

    d->ax_raw = (int16_t)(buf[0] | buf[1] << 8);
    d->ay_raw = (int16_t)(buf[2] | buf[3] << 8);
    d->az_raw = (int16_t)(buf[4] | buf[5] << 8);
    d->gx_raw = (int16_t)(buf[6] | buf[7] << 8);
    d->gy_raw = (int16_t)(buf[8] | buf[9] << 8);
    d->gz_raw = (int16_t)(buf[10]| buf[11]<< 8);
    return 0;
}
\`\`\``

const HOST_TS = `\`\`\`typescript
// Bitstream host — decode BMI270 frame
function decodePayload(payload: RawSensorPayload): SensorFrame {
  const { mask, values: v } = payload
  let idx = 0

  if (mask & 0x01) {           // ACC present
    frame.ax = v[idx]   / 100 / 9.80665  // → g
    frame.ay = v[idx+1] / 100 / 9.80665
    frame.az = v[idx+2] / 100 / 9.80665
    idx += 3
  }
  if (mask & 0x02) {           // GYR present
    frame.gx = v[idx]   / 100 * RAD2DEG  // → °/s
    idx += 3
  }
}
\`\`\``

// Data flow stages
const FLOW = [
  { label: 'BMI270\nSensor', color: 'var(--accent-cyan)', bg: 'var(--accent-cyan-bg)', desc: 'SPI @ 10 MHz' },
  { label: 'MCU\nFirmware', color: 'var(--axis-y)',     bg: 'var(--axis-y-bg)',      desc: 'Zephyr RTOS' },
  { label: 'UART\nBridge', color: 'var(--accent-amber)', bg: 'var(--accent-amber-bg)', desc: 'REQ/EVT frames' },
  { label: 'T3D WS\nBroker', color: 'var(--axis-x)',     bg: 'var(--axis-x-bg)',      desc: 'ws://localhost:9998' },
  { label: 'Host\nApp', color: 'var(--accent-purple)', bg: 'var(--accent-purple-bg)', desc: 'React / Python / etc.' },
]

export default function CodeSlide() {
  const root = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.from('.code-header',  { y: 20, opacity: 0, duration: 0.4, ease: 'power3.out' })
    gsap.from('.flow-stage',   { y: 20, opacity: 0, stagger: 0.1, duration: 0.4, ease: 'power3.out', delay: 0.15 })
    gsap.from('.code-snippet', { y: 30, opacity: 0, stagger: 0.15, duration: 0.45, ease: 'power3.out', delay: 0.5 })
  }, { scope: root })

  return (
    <div ref={root} className="flex flex-col w-full h-full px-10 py-8 gap-6 overflow-y-auto">
      {/* Header */}
      <div className="code-header flex items-center gap-2">
        <Code2 size={20} strokeWidth={1.5} style={{ color: 'var(--accent-purple)' }} />
        <Badge variant="purple">Slide 08</Badge>
        <h2 className="text-2xl font-extrabold text-[var(--text-primary)]">Code & Protocol</h2>
      </div>

      {/* Data flow diagram */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {FLOW.map((stage, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className="flow-stage flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-xl border flex-shrink-0"
              style={{ background: stage.bg, borderColor: stage.color + '55', minWidth: 90 }}
            >
              <div className="text-xs font-bold font-code text-center whitespace-pre-line leading-tight" style={{ color: stage.color }}>
                {stage.label}
              </div>
              <div className="text-2xs text-[var(--text-muted)] text-center">{stage.desc}</div>
            </div>
            {i < FLOW.length - 1 && (
              <ArrowRight size={16} strokeWidth={1.5} style={{ color: 'var(--surface-border)', flexShrink: 0 }} />
            )}
          </div>
        ))}
      </div>

      {/* Code snippets */}
      <div className="grid grid-cols-2 gap-6 flex-1">
        <div className="code-snippet flex flex-col gap-2">
          <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
            Firmware (C / Zephyr)
          </div>
          <MarkdownRenderer content={FIRMWARE_C} />
        </div>
        <div className="code-snippet flex flex-col gap-2">
          <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
            Host Decoder (TypeScript)
          </div>
          <MarkdownRenderer content={HOST_TS} />
        </div>
      </div>

      {/* Wire format summary */}
      <div className="rounded-lg bg-[var(--surface-card)] border border-[var(--surface-border)] p-4">
        <div className="text-2xs text-[var(--text-muted)] uppercase tracking-wider mb-2">T3D WS Message format (JSON)</div>
        <div className="grid grid-cols-3 gap-3 font-code text-xs">
          <div>
            <div className="text-[var(--accent-cyan)] font-bold mb-1">Subscribe</div>
            <div className="text-[var(--text-muted)]">type: "subscribe"<br />topic: "bitstream2/evt/sensor"<br />channel: "json"</div>
          </div>
          <div>
            <div className="text-[var(--axis-y)] font-bold mb-1">Incoming message</div>
            <div className="text-[var(--text-muted)]">type: "message"<br />topic: "bitstream2/evt/sensor"<br />payload: &#123; sensorId, mask, values[] &#125;</div>
          </div>
          <div>
            <div className="text-[var(--accent-amber)] font-bold mb-1">Config write</div>
            <div className="text-[var(--text-muted)]">type: "publish"<br />topic: "bitstream2/req"<br />payload: &#123; cmd, sensorId, config &#125;</div>
          </div>
        </div>
      </div>
    </div>
  )
}
