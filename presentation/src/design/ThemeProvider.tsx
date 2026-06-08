/**
 * ThemeProvider — injects CSS custom properties into <html> on theme change.
 * Also applies the global base stylesheet (scrollbars, selection, focus ring).
 */
import { useEffect } from 'react'
import { darkTheme, lightTheme, type ThemeMode } from './theme'
import { useThemeStore } from '@/store/useThemeStore'

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement
  const vars = mode === 'dark' ? darkTheme : lightTheme

  root.setAttribute('data-theme', mode)

  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value)
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Apply immediately on first render (no flash)
  useEffect(() => {
    applyTheme(theme)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <>{children}</>
}
