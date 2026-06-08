/**
 * Sidebar — slide thumbnails / navigator.
 * Collapsed by default on narrow screens.
 */
import * as LucideIcons from 'lucide-react'
import { useSlideStore } from '@/store/useSlideStore'
import { slides } from '@/slides/registry'

export function Sidebar() {
  const { index, goTo } = useSlideStore()

  return (
    <aside
      className="hidden md:flex flex-col w-[200px] flex-shrink-0 border-r border-[var(--surface-border)] bg-[var(--surface-panel)] overflow-y-auto"
    >
      <div className="p-3 space-y-1">
        {slides.map((slide, i) => {
          const isActive = i === index
          // Dynamically get Lucide icon by name
          const Icon = (LucideIcons as Record<string, React.ComponentType<{ size: number; strokeWidth: number }>>)[slide.icon] ?? LucideIcons.Circle

          return (
            <button
              key={slide.id}
              onClick={() => goTo(i)}
              className={`
                w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all duration-150
                ${isActive
                  ? 'bg-[var(--accent-cyan-bg)] border border-[var(--accent-cyan)] border-opacity-30'
                  : 'hover:bg-[var(--surface-hover)] border border-transparent'
                }
              `}
            >
              {/* Slide number */}
              <span
                className="text-2xs font-code font-bold mt-0.5 flex-shrink-0 w-4 text-right"
                style={{ color: isActive ? 'var(--accent-cyan)' : 'var(--text-muted)' }}
              >
                {String(slide.index).padStart(2, '0')}
              </span>

              {/* Icon */}
              <Icon
                size={13}
                strokeWidth={1.75}
                // @ts-expect-error style prop
                style={{ color: isActive ? 'var(--accent-cyan)' : 'var(--text-muted)', marginTop: 2 }}
              />

              {/* Title */}
              <div className="flex-1 min-w-0">
                <div
                  className="text-xs font-semibold leading-tight truncate"
                  style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                >
                  {slide.title}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Progress bar at bottom */}
      <div className="mt-auto p-3">
        <div className="h-1 rounded-full bg-[var(--surface-border)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--accent-cyan)] transition-all duration-300"
            style={{ width: `${((index + 1) / slides.length) * 100}%` }}
          />
        </div>
        <div className="mt-1 text-2xs text-[var(--text-muted)] text-center font-code">
          {index + 1} / {slides.length}
        </div>
      </div>
    </aside>
  )
}
