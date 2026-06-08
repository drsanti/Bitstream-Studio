/**
 * configWriter — publishes sensor configuration to firmware via T3D WS broker.
 *
 * Protocol:
 *   Publish to topic: bitstream2/req
 *   Payload: { cmd: 'setConfig', sensorId: 0, config: { accRange, accOdr, gyrRange, gyrOdr } }
 *
 * Response arrives on: bitstream2/res (subscribe separately if needed)
 */

export interface BMI270Config {
  accRange:   2 | 4 | 8 | 16          // g
  accOdr:     25 | 50 | 100 | 200 | 400 | 800 | 1600  // Hz
  gyrRange:   125 | 250 | 500 | 1000 | 2000           // °/s
  gyrOdr:     25 | 50 | 100 | 200 | 400 | 800 | 1600  // Hz
}

export interface ConfigWriteResult {
  ok: boolean
  error?: string
  response?: unknown
}

const WS_URL = 'ws://127.0.0.1:9998'
const TIMEOUT_MS = 3000

export async function writeConfig(config: BMI270Config): Promise<ConfigWriteResult> {
  return new Promise((resolve) => {
    let ws: WebSocket
    let timer: ReturnType<typeof setTimeout>
    let resolved = false

    const done = (result: ConfigWriteResult) => {
      if (resolved) return
      resolved = true
      clearTimeout(timer)
      try { ws?.close() } catch {}
      resolve(result)
    }

    try {
      ws = new WebSocket(WS_URL)
    } catch (e) {
      return resolve({ ok: false, error: String(e) })
    }

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'hello', role: 'config-writer', name: 'BMI270-Config' }))
      // Subscribe to response topic before sending request
      ws.send(JSON.stringify({ type: 'subscribe', topic: 'bitstream2/res', qos: 0, channel: 'json' }))
      // Send the config request
      ws.send(JSON.stringify({
        type: 'publish',
        topic: 'bitstream2/req',
        payload: { cmd: 'setConfig', sensorId: 0, config },
        qos: 0,
      }))

      timer = setTimeout(() => {
        done({ ok: false, error: 'Timeout waiting for firmware response' })
      }, TIMEOUT_MS)
    }

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data)
        if (msg.type === 'message' && msg.topic === 'bitstream2/res') {
          done({ ok: true, response: msg.payload })
        }
      } catch {}
    }

    ws.onerror = () => {
      done({ ok: false, error: 'WebSocket error — is Bitstream Studio running?' })
    }

    ws.onclose = () => {
      if (!resolved) done({ ok: false, error: 'Connection closed before response' })
    }
  })
}

// Label maps for UI dropdowns
export const ACC_RANGES: BMI270Config['accRange'][] = [2, 4, 8, 16]
export const ACC_ODRS:   BMI270Config['accOdr'][]   = [25, 50, 100, 200, 400, 800, 1600]
export const GYR_RANGES: BMI270Config['gyrRange'][] = [125, 250, 500, 1000, 2000]
export const GYR_ODRS:   BMI270Config['gyrOdr'][]   = [25, 50, 100, 200, 400, 800, 1600]
