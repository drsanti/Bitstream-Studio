import type { BsEnvelopeFrame } from "../protocol/types";
import { BsFramer, type BsFramerStats } from "../framing/bs-framer";
import { routeFrame, type BsRouterEvent } from "./router";
import { decodeSensorSampleValues } from "../domains/sensors/decode-sensor-sample";
import type {
  Bitstream2HelloPayload,
  Bitstream2SensorSamplePayload,
  Bitstream2WifiEvtPayload,
} from "../bridge/protocol";
import { bytesToBase64 } from "../util/base64";

export type BsUartPublishEvent =
  | { type: "hello"; payload: Bitstream2HelloPayload }
  | { type: "sensor"; payload: Bitstream2SensorSamplePayload }
  | { type: "wifi_evt"; payload: Bitstream2WifiEvtPayload }
  | { type: "res_frame"; frame: BsEnvelopeFrame };

/**
 * Pure UART → structured events (used by SerialPortWebSocketBridge and unit tests).
 */
export class BsUartDecoder {
  private readonly framer = new BsFramer();
  private lastCounterBySensorId: Record<number, number> = {};

  feed(chunk: Uint8Array, atMs = Date.now()): BsUartPublishEvent[] {
    const frames = this.framer.feed(chunk);
    const out: BsUartPublishEvent[] = [];

    for (const f of frames) {
      const routed = routeFrame(f);
      const ev = this.mapRouted(routed, atMs);
      if (ev) out.push(ev);
      if (routed.type === "res") {
        out.push({ type: "res_frame", frame: f });
      }
    }
    return out;
  }

  getStats(): BsFramerStats {
    return this.framer.getStats();
  }

  getLastCounterBySensorId(): Readonly<Record<number, number>> {
    return this.lastCounterBySensorId;
  }

  reset(): void {
    this.framer.reset();
    this.lastCounterBySensorId = {};
  }

  private mapRouted(routed: BsRouterEvent, atMs: number): BsUartPublishEvent | null {
    if (routed.type === "hello") {
      return {
        type: "hello",
        payload: {
          version: routed.hello.version,
          caps: routed.hello.caps,
          mtuSensor: routed.hello.mtuSensor,
          mtuCtrl: routed.hello.mtuCtrl,
          ...(routed.hello.fwTag ? { fwTag: routed.hello.fwTag } : {}),
          atMs,
        },
      };
    }
    if (routed.type === "evt_sensor") {
      const evt = routed.evt;
      this.lastCounterBySensorId[evt.sensorId] = evt.counter;

      const decoded = decodeSensorSampleValues(evt.sensorId, evt.mask, evt.valuesBytes);
      const values = decoded?.values ?? [];

      return {
        type: "sensor",
        payload: {
          sensorId: evt.sensorId,
          mask: evt.mask,
          counter: evt.counter,
          tMs: evt.tMs,
          values,
          atMs,
        },
      };
    }
    if (routed.type === "evt_status") {
      return {
        type: "wifi_evt",
        payload: {
          innerB64: bytesToBase64(routed.payload),
          atMs,
        },
      };
    }
    return null;
  }
}
