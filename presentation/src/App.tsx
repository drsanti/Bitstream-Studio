import { useEffect } from 'react'
import { ThemeProvider } from './design/ThemeProvider'
import { Shell } from './layout/Shell'
import { attachKeyboardNav } from './store/useSlideStore'

export function App() {
  useEffect(() => {
    const cleanup = attachKeyboardNav()
    return cleanup
  }, [])

  return (
    <ThemeProvider>
      <Shell />
    </ThemeProvider>
  )
}
