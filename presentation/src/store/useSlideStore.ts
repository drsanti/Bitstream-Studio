import { create } from 'zustand'
import { slides } from '@/slides/registry'

interface SlideStore {
  index: number         // 0-based current slide index
  total: number
  notesOpen: boolean
  fullscreen: boolean

  goTo:   (i: number)  => void
  next:   ()           => void
  prev:   ()           => void
  toggleNotes: ()      => void
  toggleFullscreen: () => void
}

export const useSlideStore = create<SlideStore>((set, get) => ({
  index:      0,
  total:      slides.length,
  notesOpen:  false,
  fullscreen: false,

  goTo: (i) => set({ index: Math.max(0, Math.min(slides.length - 1, i)) }),
  next: ()  => set((s) => ({ index: Math.min(s.index + 1, slides.length - 1) })),
  prev: ()  => set((s) => ({ index: Math.max(s.index - 1, 0) })),

  toggleNotes:      () => set((s) => ({ notesOpen: !s.notesOpen })),
  toggleFullscreen: () => {
    const entering = !get().fullscreen
    if (entering) {
      document.documentElement.requestFullscreen?.().catch(() => {})
    } else {
      document.exitFullscreen?.().catch(() => {})
    }
    set({ fullscreen: entering })
  },
}))

// Keyboard navigation — mounted once in App.tsx
export function attachKeyboardNav() {
  const handler = (e: KeyboardEvent) => {
    // Don't fire inside inputs
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as Element)?.tagName)) return

    const store = useSlideStore.getState()
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case 'PageDown':
      case ' ':
        e.preventDefault()
        store.next()
        break
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
        e.preventDefault()
        store.prev()
        break
      case 's':
      case 'S':
        store.toggleNotes()
        break
      case 'f':
      case 'F':
        store.toggleFullscreen()
        break
      case 'Home':
        store.goTo(0)
        break
      case 'End':
        store.goTo(store.total - 1)
        break
    }
  }
  window.addEventListener('keydown', handler)
  return () => window.removeEventListener('keydown', handler)
}
