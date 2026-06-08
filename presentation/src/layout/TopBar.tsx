import { Sun, Moon, Maximize, Minimize, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react'
import { useThemeStore } from '@/store/useThemeStore'
import { useSlideStore } from '@/store/useSlideStore'
import { ConnectionBar } from './ConnectionBar'
import { slides } from '@/slides/registry'
import type { ConnectionMode } from '@/sensor/types'

interface Props {
  mode:       ConnectionMode
  onForce?:  () => void
  onRetry?:  () => void
}

export function TopBar({ mode, onForce, onRetry }: Props) {
  const { theme, toggle } = useThemeStore()
  const { index, total, prev, next, toggleNotes, toggleFullscreen, fullscreen, notesOpen } = useSlideStore()
  const slide = slides[index]

  return (
    <header
      className="flex items-center gap-3 px-4 h-11 flex-shrink-0 border-b border-[var(--surface-border)] bg-[var(--surface-panel)] z-40"
      style={{ userSelect: 'none' }}
    >
      {/* Logo / Brand */}
      <div className="flex items-center gap-2 mr-2">
        <div className="w-5 h-5 rounded bg-[var(--accent-cyan-bg)] flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-sm bg-[var(--accent-cyan)]" />
        </div>
        <span className="text-xs font-bold tracking-wide text-[var(--text-secondary)]">
          Bitstream
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-[var(--surface-border)]" />

      {/* Slide nav */}
      <div className="flex items-center gap-1">
        <IconBtn onClick={prev} disabled={index === 0} title="Previous (←)">
          <ChevronLeft size={14} strokeWidth={2} />
        </IconBtn>
        <span className="text-xs font-code text-[var(--text-secondary)] min-w-[3.5rem] text-center">
          {index + 1} / {total}
        </span>
        <IconBtn onClick={next} disabled={index === total - 1} title="Next (→)">
          <ChevronRight size={14} strokeWidth={2} />
        </IconBtn>
      </div>

      {/* Slide title */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <span className="text-xs text-[var(--text-muted)] font-semibold truncate">
          {slide?.title}
        </span>
        <span className="hidden md:block text-2xs text-[var(--text-muted)] opacity-50 truncate">
          — {slide?.subtitle}
        </span>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-2">
        <ConnectionBar mode={mode} onForce={onForce} onRetry={onRetry} />

        <div className="w-px h-5 bg-[var(--surface-border)]" />

        <IconBtn onClick={toggleNotes} title="Speaker notes (S)" active={notesOpen}>
          <MessageSquare size={14} strokeWidth={1.75} />
        </IconBtn>

        <IconBtn onClick={toggle} title="Toggle theme">
          {theme === 'dark'
            ? <Sun size={14} strokeWidth={1.75} />
            : <Moon size={14} strokeWidth={1.75} />
          }
        </IconBtn>

        <IconBtn onClick={toggleFullscreen} title="Fullscreen (F)">
          {fullscreen
            ? <Minimize size={14} strokeWidth={1.75} />
            : <Maximize size={14} strokeWidth={1.75} />
          }
        </IconBtn>
      </div>
    </header>
  )
}

function IconBtn({
  children, onClick, disabled, title, active,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  title?: string
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        w-7 h-7 flex items-center justify-center rounded transition-colors
        disabled:opacity-30 disabled:cursor-not-allowed
        ${active
          ? 'bg-[var(--accent-cyan-bg)] text-[var(--accent-cyan)]'
          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
        }
      `}
    >
      {children}
    </button>
  )
}
