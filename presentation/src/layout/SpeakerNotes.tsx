/**
 * SpeakerNotes — slides up from the bottom when toggled (S key).
 * Renders the current slide's notes.md via MarkdownRenderer.
 * GSAP animates the panel in/out.
 */
import { useRef, useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { X, MessageSquare } from 'lucide-react'
import { useSlideStore } from '@/store/useSlideStore'
import { slides } from '@/slides/registry'
import { MarkdownRenderer } from '@/design/components/MarkdownRenderer'

export function SpeakerNotes() {
  const { notesOpen, index, toggleNotes } = useSlideStore()
  const panelRef = useRef<HTMLDivElement>(null)
  const [notesContent, setNotesContent] = useState<string>('')
  const slide = slides[index]

  // Animate panel on open/close
  useEffect(() => {
    if (!panelRef.current) return
    if (notesOpen) {
      gsap.fromTo(panelRef.current,
        { y: '100%', opacity: 0 },
        { y: '0%',   opacity: 1, duration: 0.35, ease: 'power3.out' }
      )
    } else {
      gsap.to(panelRef.current, { y: '100%', opacity: 0, duration: 0.25, ease: 'power3.in' })
    }
  }, [notesOpen])

  // Load notes.md on slide change
  useEffect(() => {
    if (!slide) return
    slide.notes()
      .then((mod) => setNotesContent(mod.default))
      .catch(() => setNotesContent('_No speaker notes for this slide._'))
  }, [index, slide])

  if (!notesOpen) return null

  return (
    <div
      ref={panelRef}
      className="absolute bottom-0 left-0 right-0 z-30 h-64 border-t border-[var(--surface-border)] bg-[var(--surface-panel)] shadow-panel flex flex-col"
      style={{ transform: 'translateY(100%)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-9 border-b border-[var(--surface-border)] flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare size={13} strokeWidth={1.75} style={{ color: 'var(--accent-cyan)' }} />
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            Speaker Notes — {slide?.title}
          </span>
        </div>
        <button
          onClick={toggleNotes}
          className="w-6 h-6 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
        >
          <X size={13} strokeWidth={2} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <MarkdownRenderer content={notesContent} className="prose-notes" />
      </div>
    </div>
  )
}
