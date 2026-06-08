/**
 * WaveCanvas — scrolling waveform canvas.
 * - ResizeObserver keeps canvas pixel-perfect at any container size.
 * - CSS var() strings are resolved to computed values before passing to Canvas 2D API.
 * - Full cleanup on unmount.
 */
import { useRef, useEffect, useCallback } from 'react'

export interface WaveChannel {
  color:     string
  gradFrom?: string
  gradTo?:   string
  data:      Float32Array | number[]
}

interface Props {
  channels:  WaveChannel[]
  min?:      number
  max?:      number
  lineWidth?: number
  className?: string
}

/** Resolve `var(--foo)` → computed string, passthrough everything else. */
function resolveColor(value: string): string {
  if (!value.startsWith('var(')) return value
  const prop = value.slice(4, -1).trim()
  return getComputedStyle(document.documentElement).getPropertyValue(prop).trim() || 'transparent'
}

export function WaveCanvas({ channels, min = -2, max = 2, lineWidth = 1.5, className = '' }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // ── Draw ──────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = canvas
    if (width === 0 || height === 0) return

    ctx.clearRect(0, 0, width, height)

    const range = max - min

    for (const ch of channels) {
      if (!ch.data || ch.data.length < 2) continue
      const n     = ch.data.length
      const xStep = width / (n - 1)
      const getY  = (v: number) => height - ((Math.max(min, Math.min(max, v)) - min) / range) * height

      const resolvedColor     = resolveColor(ch.color)
      const resolvedGradFrom  = resolveColor(ch.gradFrom ?? ch.color)
      const resolvedGradTo    = resolveColor(ch.gradTo   ?? 'transparent')

      // Gradient fill under curve
      const grad = ctx.createLinearGradient(0, 0, 0, height)
      grad.addColorStop(0, resolvedGradFrom)
      grad.addColorStop(1, resolvedGradTo)

      ctx.beginPath()
      for (let i = 0; i < n; i++) {
        const x = i * xStep
        const y = getY(ch.data[i])
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
      }
      ctx.lineTo((n - 1) * xStep, height)
      ctx.lineTo(0, height)
      ctx.closePath()
      ctx.fillStyle = grad
      ctx.fill()

      // Line
      ctx.beginPath()
      ctx.strokeStyle = resolvedColor
      ctx.lineWidth   = lineWidth
      ctx.lineJoin    = 'round'
      for (let i = 0; i < n; i++) {
        const x = i * xStep
        const y = getY(ch.data[i])
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }

    // Zero line
    const zy = height - ((0 - min) / range) * height
    ctx.beginPath()
    ctx.setLineDash([4, 4])
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'
    ctx.lineWidth   = 1
    ctx.moveTo(0, zy)
    ctx.lineTo(width, zy)
    ctx.stroke()
    ctx.setLineDash([])
  }, [channels, min, max, lineWidth])

  // ── Resize observer — updates canvas backing store on container size change ─
  useEffect(() => {
    const canvas    = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const dpr = window.devicePixelRatio || 1

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        canvas.width  = Math.floor(width  * dpr)
        canvas.height = Math.floor(height * dpr)
        canvas.style.width  = `${width}px`
        canvas.style.height = `${height}px`
        const ctx = canvas.getContext('2d')
        ctx?.scale(dpr, dpr)
        draw()
      }
    })

    ro.observe(container)
    return () => ro.disconnect()
  }, [draw])

  // ── Redraw whenever data changes ──────────────────────────────────────────
  useEffect(() => { draw() }, [draw])

  return (
    <div ref={containerRef} className={`w-full h-full ${className}`} style={{ position: 'relative' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  )
}
