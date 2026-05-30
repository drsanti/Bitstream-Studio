/**
 * Broker → UI telemetry for WebSocket activity monitoring.
 * The server delivers payloads on {@link T3D_WS_BROKER_MONITOR_TOPIC} to subscribed clients.
 */

export const T3D_WS_BROKER_MONITOR_TOPIC = "t3d/broker/monitor" as const;

export type BrokerMonitorChannel = "json" | "binary";

export type BrokerMonitorPublisher = {
  role?: string;
  name?: string;
  instance?: string;
  meta?: Record<string, string>;
};

/** Body (without `ts`) — server wraps with `{ ts: number, ...body }`. */
export type BrokerMonitorBody =
  | { kind: "client-connected"; clientId: string; connectedAt: number }
  | { kind: "client-disconnected"; clientId: string }
  | {
      kind: "client-identified";
      clientId: string;
      identity: BrokerMonitorPublisher;
    }
  | {
      kind: "subscription-added";
      clientId: string;
      topic: string;
      qos: 0 | 1 | 2;
      channel: BrokerMonitorChannel;
    }
  | {
      kind: "subscription-removed";
      clientId: string;
      topic: string;
      channel: BrokerMonitorChannel | "both";
    }
  | {
      kind: "message-published";
      channel: BrokerMonitorChannel;
      topic: string;
      qos: 0 | 1 | 2;
      from?: string;
      publisher?: BrokerMonitorPublisher;
      correlationId?: string;
    };

export type BrokerMonitorEnvelope = BrokerMonitorBody & { ts: number };

export function isBrokerMonitorEnvelope(value: unknown): value is BrokerMonitorEnvelope {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return typeof o.ts === "number" && typeof o.kind === "string";
}
