/**
 * Shell — main layout container.
 *
 * Slide transition uses a double-buffer (slot A / slot B).
 * State tracks which index each slot holds and which is "front".
 * GSAP animates old front out and new front in — no stale-ref issue.
 */
import { useRef, useEffect, useState, Suspense } from 'react'
import { gsap } from 'gsap'
import { useSlideStore } from '@/store/useSlideStore'
import { useBitstreamSensor } from '@/sensor/useBitstreamSensor'
import { slides } from '@/slides/registry'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'
import { SpeakerNotes } from './SpeakerNotes'
import { ErrorBoundary } from '@/design/components/ErrorBoundary'

const DURATION = 0.28
const EASE_OUT = 'power3.out'
const EASE_IN  = 'power3.in'

export function Shell() {
  const { index } = useSlideStore()
  const { mode, forceSim, reconnect } = useBitstreamSensor()

  // ── Double-buffer state ──────────────────────────────────────────────────
  // Each slot holds a slide index. "front" is the currently visible slot.
  const [slotA, setSlotA] = useState(0)
  const [slotB, setSlotB] = useState(0)
  const [front, setFront] = useState<'a' | 'b'>('a')

  const slotARef = useRef<HTMLDivElement>(null)
  const slotBRef = useRef<HTMLDivElement>(null)
  const prevIndex = useRef(index)
  const animating = useRef(false)

  // Initial mount — slot A visible, slot B hidden
  useEffect(() => {
    gsap.set(slotARef.current, { x: 0, opacity: 1, zIndex: 1 })
    gsap.set(slotBRef.current, { x: 0, opacity: 0, zIndex: 0 })
  }, [])

  useEffect(() => {
    if (index === prevIndex.current || animating.current) return
    const dir = index > prevIndex.current ? 1 : -1
    prevIndex.current = index

    // Determine which slot is back (will receive new slide)
    const nextFront = front === 'a' ? 'b' : 'a'
    const frontRef  = front === 'a' ? slotARef : slotBRef
    const backRef   = front === 'a' ? slotBRef : slotARef

    // Load new slide into back slot before animating
    if (nextFront === 'a') setSlotA(index)
    else setSlotB(index)

    animating.current = true

    // Position back slot off-screen, bring to top
    gsap.set(backRef.current, { x: `${dir * 55}%`, opacity: 0, zIndex: 2 })
    gsap.set(frontRef.current, { zIndex: 1 })

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(frontRef.current, { opacity: 0, zIndex: 0 })
        gsap.set(backRef.current, { zIndex: 1 })
        setFront(nextFront)
        animating.current = false
      },
    })

    tl.to(frontRef.current, {
      x: `${-dir * 35}%`, opacity: 0,
      duration: DURATION, ease: EASE_IN,
    }, 0)
    tl.to(backRef.current, {
      x: 0, opacity: 1,
      duration: DURATION * 1.25, ease: EASE_OUT,
    }, DURATION * 0.4)
  }, [index, front])

  const CompA = slides[slotA]?.Component
  const CompB = slides[slotB]?.Component

  return (
    <div className="flex flex-col h-full bg-[var(--surface-bg)]">
      <TopBar mode={mode} onForce={forceSim} onRetry={reconnect} />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />

        <main className="flex-1 relative overflow-hidden">
          {/* Slot A */}
          <div ref={slotARef} className="slide-root">
            <ErrorBoundary slideId={slides[slotA]?.id ?? 'slide-a'}>
              <Suspense fallback={<SlideLoading />}>
                {CompA && <CompA />}
              </Suspense>
            </ErrorBoundary>
          </div>

          {/* Slot B */}
          <div ref={slotBRef} className="slide-root">
            <ErrorBoundary slideId={slides[slotB]?.id ?? 'slide-b'}>
              <Suspense fallback={<SlideLoading />}>
                {CompB && <CompB />}
              </Suspense>
            </ErrorBoundary>
          </div>

          <SpeakerNotes />
        </main>
      </div>
    </div>
  )
}

function SlideLoading() {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-cyan)] border-t-transparent animate-spin" />
    </div>
  )
}
