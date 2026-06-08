import { create } from 'zustand'
import type { ThemeMode } from '@/design/theme'

interface ThemeStore {
  theme: ThemeMode
  toggle: () => void
  set: (t: ThemeMode) => void
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: (document.documentElement.getAttribute('data-theme') as ThemeMode) ?? 'dark',
  toggle: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
  set:    (theme) => set({ theme }),
}))
