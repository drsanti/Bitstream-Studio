/**
 * ConnectionBar — WS connection status chip in the TopBar.
 * Uses Lucide icons + GSAP pulse ring on LIVE state.
 */
import { useRef, useEffect } from 'react'
import { Wifi, WifiOff, Loader2, FlaskConical } from 'lucide-react'
import { gsap } from 'gsap'
import type { ConnectionMode } from '@/sensor/types'

interface Props {
  mode:      ConnectionMode
  onForce?:  () => void
  onRetry?:  () => void
}

const labels: Record<ConnectionMode, string> = {
  live:         'LIVE',
  connecting:   'Connecting…',
  disconnected: 'Disconnected',
  sim:          'Simulation',
}

const colors: Record<ConnectionMode, string> = {
  live:         'var(--status-live)',
  connecting:   'var(--status-connecting)',
  disconnected: 'var(--status-disconnected)',
  sim:          'var(--status-sim)',
}

export function ConnectionBar({ mode, onForce, onRetry }: Props) {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!dotRef.current || !ringRef.current) return
    gsap.killTweensOf(ringRef.current)
    if (mode === 'live') {
      gsap.fromTo(ringRef.current,
        { scale: 1, opacity: 0.8 },
        { scale: 2, opacity: 0, duration: 1.4, ease: 'power2.out', repeat: -1 }
      )
    } else {
      gsap.set(ringRef.current, { opacity: 0 })
    }
  }, [mode])

  const Icon = mode === 'live'         ? Wifi
             : mode === 'disconnected' ? WifiOff
             : mode === 'connecting'   ? Loader2
             : FlaskConical

  const color = colors[mode]

  return (
    <div className="flex items-center gap-2">
      {/* Dot + pulse ring */}
      <div className="relative flex items-center justify-center w-4 h-4">
        <div
          ref={ringRef}
          className="absolute inset-0 rounded-full"
          style={{ background: color, opacity: 0 }}
        />
        <div
          ref={dotRef}
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: color }}
        />
      </div>

      {/* Icon */}
      <Icon
        size={14}
        strokeWidth={1.75}
        style={{ color }}
        className={mode === 'connecting' ? 'animate-spin' : ''}
      />

      {/* Label */}
      <span className="text-xs font-semibold font-code" style={{ color }}>
        {labels[mode]}
      </span>

      {/* Actions */}
      {mode === 'disconnected' && onRetry && (
        <button
          onClick={onRetry}
          className="text-2xs px-2 py-0.5 rounded border border-[var(--surface-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent-cyan)] transition-colors"
        >
          Retry
        </button>
      )}
      {(mode === 'disconnected' || mode === 'connecting') && onForce && (
        <button
          onClick={onForce}
          className="text-2xs px-2 py-0.5 rounded border border-[var(--surface-border)] text-[var(--text-muted)] hover:text-[var(--accent-purple)] hover:border-[var(--accent-purple)] transition-colors"
        >
          Simulate
        </button>
      )}
    </div>
  )
}
