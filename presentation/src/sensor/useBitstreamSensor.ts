/**
 * useBitstreamSensor — React hook for live BMI270 data via T3D WS broker.
 *
 * Connection flow:
 *  1. Connect to ws://127.0.0.1:9998
 *  2. Send hello + subscribe to bitstream2/evt/sensor
 *  3. Decode incoming frames → SensorFrame
 *  4. If connection fails → fall back to simulation at 60 fps
 *
 * Returns a ref-stable SensorFrame (does NOT trigger renders on every frame).
 * Use useSensorSnapshot() for reactive displays.
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { decodePayload } from './decoder'
import { simulateFrame } from './simulation'
import { DEFAULT_FRAME, type ConnectionMode, type SensorFrame, type T3DMessage } from './types'
import { config } from '@/config'

const WS_URL            = config.wsUrl
const RECONNECT_DELAY_MS = 3000
const SIM_FPS           = config.simFps

// ─── Shared singleton across all hook consumers ──────────────────────────────
let _wsInstance: WebSocket | null = null
let _mode: ConnectionMode = 'disconnected'
let _latestFrame: SensorFrame = { ...DEFAULT_FRAME }
let _simTimer: ReturnType<typeof setInterval> | null = null
let _reconnectTimer: ReturnType<typeof setTimeout> | null = null
const _listeners = new Set<() => void>()

function notify() {
  _listeners.forEach((fn) => fn())
}

function startSim() {
  if (_simTimer) return
  _simTimer = setInterval(() => {
    _latestFrame = simulateFrame()
    notify()
  }, 1000 / SIM_FPS)
}

function stopSim() {
  if (_simTimer) { clearInterval(_simTimer); _simTimer = null }
}

function connect() {
  if (_wsInstance && _wsInstance.readyState < WebSocket.CLOSING) return

  _mode = 'connecting'
  notify()

  const ws = new WebSocket(WS_URL)
  _wsInstance = ws

  ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'hello', role: 'presenter', name: 'BMI270-Presentation' }))
    ws.send(JSON.stringify({ type: 'subscribe', topic: 'bitstream2/evt/sensor', qos: 0, channel: 'json' }))
    _mode = 'live'
    stopSim()
    notify()
  }

  ws.onmessage = (evt) => {
    try {
      const msg: T3DMessage = JSON.parse(evt.data)
      if (msg.type === 'message' && msg.topic === 'bitstream2/evt/sensor') {
        _latestFrame = decodePayload(msg.payload)
        notify()
      }
    } catch {
      // malformed message — ignore
    }
  }

  ws.onerror = () => {
    // onclose will handle reconnection
  }

  ws.onclose = () => {
    _wsInstance = null
    if (_mode !== 'sim') {
      _mode = 'disconnected'
      notify()
      startSim()
      _reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS)
    }
  }
}

// Kick off connection immediately when module loads
connect()

// ─── Hook ────────────────────────────────────────────────────────────────────
export interface SensorHookResult {
  frame:      SensorFrame
  mode:       ConnectionMode
  forceSim:   () => void
  reconnect:  () => void
}

/**
 * Low-frequency snapshot — updates at `fps` rate (default 30) so React
 * components don't choke on 200 Hz sensor data.
 */
export function useBitstreamSensor(fps = 30): SensorHookResult {
  const [frame, setFrame] = useState<SensorFrame>(_latestFrame)
  const [mode,  setMode]  = useState<ConnectionMode>(_mode)
  const intervalMs = 1000 / fps
  const lastUpdateRef = useRef(0)

  const onUpdate = useCallback(() => {
    const now = performance.now()
    if (now - lastUpdateRef.current >= intervalMs) {
      lastUpdateRef.current = now
      setFrame({ ..._latestFrame })
      setMode(_mode)
    }
  }, [intervalMs])

  useEffect(() => {
    _listeners.add(onUpdate)
    return () => { _listeners.delete(onUpdate) }
  }, [onUpdate])

  const forceSim = useCallback(() => {
    _mode = 'sim'
    _wsInstance?.close()
    if (_reconnectTimer) { clearTimeout(_reconnectTimer); _reconnectTimer = null }
    startSim()
    setMode('sim')
  }, [])

  const reconnect = useCallback(() => {
    stopSim()
    _mode = 'connecting'
    setMode('connecting')
    connect()
  }, [])

  return { frame, mode, forceSim, reconnect }
}

/**
 * High-frequency frame ref — always has the latest frame but never triggers
 * React renders. Use for Three.js useFrame() callbacks.
 */
export function useSensorRef() {
  const ref = useRef<SensorFrame>(_latestFrame)

  useEffect(() => {
    const fn = () => { ref.current = _latestFrame }
    _listeners.add(fn)
    return () => { _listeners.delete(fn) }
  }, [])

  return ref
}
