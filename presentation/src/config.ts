/**
 * Runtime configuration — read from Vite env variables at build time.
 * Override in .env.local or pass at build: VITE_WS_URL=ws://192.168.1.5:9998 npm run build
 */

export const config = {
  /** T3D WebSocket broker URL */
  wsUrl: import.meta.env.VITE_WS_URL ?? 'ws://127.0.0.1:9998',

  /** Simulation fallback FPS when disconnected */
  simFps: Number(import.meta.env.VITE_SIM_FPS ?? 60),

  /** Sensor hook update rate for reactive UI components (lower = less React renders) */
  uiFps: Number(import.meta.env.VITE_UI_FPS ?? 30),

  /** App version from package.json (injected by Vite define) */
  version: __APP_VERSION__,
} as const

// Type-safe env access
declare const __APP_VERSION__: string
