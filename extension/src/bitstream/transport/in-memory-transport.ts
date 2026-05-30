import type { TransportAdapter, TransportState } from "./transport-adapter";

interface InMemoryTransportOptions {
  name?: string;
  latencyMs?: number;
}

type DataHandler = (bytes: Uint8Array) => void;
type StateHandler = (state: TransportState) => void;

function cloneBytes(bytes: Uint8Array): Uint8Array {
  const out = new Uint8Array(bytes.byteLength);
  out.set(bytes);
  return out;
}

export class InMemoryTransportAdapter implements TransportAdapter {
  readonly transportName: string;

  private state: TransportState = "disconnected";
  private readonly latencyMs: number;
  private peer: InMemoryTransportAdapter | null = null;
  private readonly dataHandlers = new Set<DataHandler>();
  private readonly stateHandlers = new Set<StateHandler>();

  constructor(options: InMemoryTransportOptions = {}) {
    this.transportName = options.name ?? "in-memory";
    this.latencyMs = Math.max(0, Math.floor(options.latencyMs ?? 0));
  }

  attachPeer(peer: InMemoryTransportAdapter): void {
    this.peer = peer;
  }

  async open(): Promise<void> {
    this.setState("connecting");
    this.setState("connected");
  }

  async close(): Promise<void> {
    this.setState("disconnected");
  }

  async write(bytes: Uint8Array): Promise<void> {
    if (this.state !== "connected") {
      throw new Error(`${this.transportName} is not connected`);
    }
    if (!this.peer || this.peer.state !== "connected") {
      throw new Error(`${this.transportName} peer is not connected`);
    }

    const payload = cloneBytes(bytes);
    if (this.latencyMs <= 0) {
      this.peer.deliver(payload);
      return;
    }

    await new Promise<void>((resolve) => {
      setTimeout(() => {
        this.peer?.deliver(payload);
        resolve();
      }, this.latencyMs);
    });
  }

  onData(handler: DataHandler): () => void {
    this.dataHandlers.add(handler);
    return () => {
      this.dataHandlers.delete(handler);
    };
  }

  onState(handler: StateHandler): () => void {
    this.stateHandlers.add(handler);
    handler(this.state);
    return () => {
      this.stateHandlers.delete(handler);
    };
  }

  getTransportState(): TransportState {
    return this.state;
  }

  private deliver(bytes: Uint8Array): void {
    for (const handler of this.dataHandlers) {
      handler(bytes);
    }
  }

  private setState(next: TransportState): void {
    if (next === this.state) {
      return;
    }
    this.state = next;
    for (const handler of this.stateHandlers) {
      handler(next);
    }
  }
}

export function createLinkedInMemoryTransports(options?: {
  left?: InMemoryTransportOptions;
  right?: InMemoryTransportOptions;
}): { left: InMemoryTransportAdapter; right: InMemoryTransportAdapter } {
  const left = new InMemoryTransportAdapter(options?.left);
  const right = new InMemoryTransportAdapter(options?.right);
  left.attachPeer(right);
  right.attachPeer(left);
  return { left, right };
}
