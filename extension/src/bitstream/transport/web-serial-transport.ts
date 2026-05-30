import type { TransportAdapter, TransportState } from "./transport-adapter";

export interface WebSerialPortLike {
  open(options: {
    baudRate: number;
    dataBits?: number;
    stopBits?: number;
    parity?: "none" | "even" | "odd";
    flowControl?: "none" | "hardware";
  }): Promise<void>;
  close(): Promise<void>;
  readable?: {
    getReader(): {
      read(): Promise<{ done?: boolean; value?: Uint8Array }>;
      cancel(): Promise<void>;
      releaseLock(): void;
    };
  };
  writable?: {
    getWriter(): {
      write(data: Uint8Array): Promise<void>;
      close(): Promise<void>;
      releaseLock(): void;
    };
  };
}

export interface WebSerialTransportOptions {
  transportName?: string;
  baudRate: number;
  dataBits?: number;
  stopBits?: number;
  parity?: "none" | "even" | "odd";
  flowControl?: "none" | "hardware";
  getPort?: () => Promise<WebSerialPortLike>;
  port?: WebSerialPortLike;
}

export class WebSerialTransportAdapter implements TransportAdapter {
  readonly transportName: string;

  private readonly options: WebSerialTransportOptions;
  private state: TransportState = "disconnected";
  private readonly dataHandlers = new Set<(bytes: Uint8Array) => void>();
  private readonly stateHandlers = new Set<(state: TransportState) => void>();
  private port: WebSerialPortLike | null = null;
  private reader: {
    read(): Promise<{ done?: boolean; value?: Uint8Array }>;
    cancel(): Promise<void>;
    releaseLock(): void;
  } | null = null;
  private readLoopTask: Promise<void> | null = null;
  private readLoopActive = false;

  constructor(options: WebSerialTransportOptions) {
    this.options = options;
    this.transportName = options.transportName ?? "web-serial";
  }

  async open(): Promise<void> {
    if (this.state === "connected") {
      return;
    }

    this.setState("connecting");

    const port = await this.resolvePort();
    this.port = port;

    await port.open({
      baudRate: this.options.baudRate,
      dataBits: this.options.dataBits,
      stopBits: this.options.stopBits,
      parity: this.options.parity,
      flowControl: this.options.flowControl,
    });

    if (!port.readable || !port.writable) {
      this.setState("error");
      throw new Error("Web Serial port does not expose readable/writable streams");
    }

    this.readLoopActive = true;
    this.reader = port.readable.getReader();
    this.readLoopTask = this.startReadLoop();

    this.setState("connected");
  }

  async close(): Promise<void> {
    if (!this.port) {
      this.setState("disconnected");
      return;
    }

    this.readLoopActive = false;

    if (this.reader) {
      try {
        await this.reader.cancel();
      } catch {
        // Ignore cancellation errors while closing.
      }
      this.reader.releaseLock();
      this.reader = null;
    }

    if (this.readLoopTask) {
      try {
        await this.readLoopTask;
      } catch {
        // Ignore read loop errors while closing.
      }
      this.readLoopTask = null;
    }

    try {
      await this.port.close();
    } finally {
      this.port = null;
      this.setState("disconnected");
    }
  }

  async write(bytes: Uint8Array): Promise<void> {
    if (!this.port || this.state !== "connected") {
      throw new Error("Web Serial transport is not connected");
    }
    if (!this.port.writable) {
      throw new Error("Web Serial transport has no writable stream");
    }

    const writer = this.port.writable.getWriter();
    try {
      await writer.write(bytes);
      if (typeof writer.close === "function") {
        await writer.close();
      }
    } finally {
      writer.releaseLock();
    }
  }

  onData(handler: (bytes: Uint8Array) => void): () => void {
    this.dataHandlers.add(handler);
    return () => {
      this.dataHandlers.delete(handler);
    };
  }

  onState(handler: (state: TransportState) => void): () => void {
    this.stateHandlers.add(handler);
    handler(this.state);
    return () => {
      this.stateHandlers.delete(handler);
    };
  }

  getTransportState(): TransportState {
    return this.state;
  }

  private async resolvePort(): Promise<WebSerialPortLike> {
    if (this.options.port) {
      return this.options.port;
    }

    if (this.options.getPort) {
      return await this.options.getPort();
    }

    const maybeNavigator = globalThis as unknown as {
      navigator?: {
        serial?: {
          requestPort(): Promise<WebSerialPortLike>;
        };
      };
    };

    const requestPort = maybeNavigator.navigator?.serial?.requestPort;
    if (typeof requestPort !== "function") {
      throw new Error("Web Serial API is unavailable; provide options.getPort or options.port");
    }

    return await requestPort.call(maybeNavigator.navigator!.serial);
  }

  private async startReadLoop(): Promise<void> {
    if (!this.reader) {
      return;
    }

    while (this.readLoopActive) {
      try {
        const chunk = await this.reader.read();
        if (chunk.done) {
          break;
        }

        if (chunk.value && chunk.value.byteLength > 0) {
          for (const handler of this.dataHandlers) {
            handler(chunk.value);
          }
        }
      } catch (error) {
        if (this.readLoopActive) {
          this.setState("error");
          throw error;
        }
        break;
      }
    }
  }

  private setState(next: TransportState): void {
    if (this.state === next) {
      return;
    }
    this.state = next;
    for (const handler of this.stateHandlers) {
      handler(next);
    }
  }
}
