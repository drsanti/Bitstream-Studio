import type { CapsAck, HelloAck, PingAck, StatusAck } from "../commands/ack-decoders";
import type { HostSession } from "./host-session";

export interface HandshakeSequenceResult {
  hello: HelloAck;
  ping: PingAck;
  caps: CapsAck;
  status: StatusAck;
  protocolVersion: number;
  capsFlags: number;
  statusCounter: number;
  durationsMs: {
    hello: number;
    ping: number;
    caps: number;
    status: number;
    total: number;
  };
}

interface HandshakeSequenceOptions {
  requestIdPrefix?: string;
  protocolVersion?: number;
  pingNonce?: number;
}

function makeRequestId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function runHandshakeStep<T>(step: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error: unknown) {
    const base = error instanceof Error ? error.message : String(error);
    throw new Error(`${step} failed: ${base}`);
  }
}

export async function runHandshakeSequence(
  session: HostSession,
  options: HandshakeSequenceOptions = {},
): Promise<HandshakeSequenceResult> {
  const requestIdPrefix = options.requestIdPrefix ?? "handshake";
  const protocolVersion = options.protocolVersion ?? 2;
  const pingNonce = options.pingNonce ?? 0x7f;

  const totalStart = Date.now();

  const helloStart = Date.now();
  const hello = await runHandshakeStep("HELLO", () =>
    session.sendHello(makeRequestId(`${requestIdPrefix}-hello`), protocolVersion),
  );
  const helloMs = Date.now() - helloStart;

  const pingStart = Date.now();
  const ping = await runHandshakeStep("PING", () =>
    session.sendPing(makeRequestId(`${requestIdPrefix}-ping`), pingNonce),
  );
  const pingMs = Date.now() - pingStart;

  const capsStart = Date.now();
  const caps = await runHandshakeStep("CAPS", () =>
    session.sendCaps(makeRequestId(`${requestIdPrefix}-caps`)),
  );
  const capsMs = Date.now() - capsStart;

  const statusStart = Date.now();
  const status = await runHandshakeStep("STATUS", () =>
    session.sendStatus(makeRequestId(`${requestIdPrefix}-status`)),
  );
  const statusMs = Date.now() - statusStart;

  const totalMs = Date.now() - totalStart;

  return {
    hello,
    ping,
    caps,
    status,
    protocolVersion: hello.protocolVersion,
    capsFlags: caps.capsFlags,
    statusCounter: status.counter,
    durationsMs: {
      hello: helloMs,
      ping: pingMs,
      caps: capsMs,
      status: statusMs,
      total: totalMs,
    },
  };
}
