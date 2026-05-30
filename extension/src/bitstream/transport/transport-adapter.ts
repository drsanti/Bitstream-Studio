export type TransportState = "disconnected" | "connecting" | "connected" | "reconnecting" | "error";

export interface TransportCapabilities {
  maxPayloadBytes?: number;
  supportsBinary?: boolean;
  metadata?: Record<string, unknown>;
}

export interface TransportAdapter {
  readonly transportName: string;
  readonly capabilities?: TransportCapabilities;
  open(): Promise<void>;
  close(): Promise<void>;
  write(bytes: Uint8Array): Promise<void>;
  onData(handler: (bytes: Uint8Array) => void): () => void;
  onState(handler: (state: TransportState) => void): () => void;
  /**
   * Current lifecycle state (for health checks). Implemented by built-in transports; optional on
   * test doubles.
   */
  getTransportState?(): TransportState;
  /**
   * Optional: publish JSON on the shared WebSocket broker (same client as the serial tunnel).
   * Used to fan-out verified firmware-visible config to every dashboard subscriber (see
   * `serialport/sensor-cfg-updated`). Only implemented on transports that share the broker
   * (e.g. {@link SerialBridgeTransportAdapter}).
   */
  publishBrokerJson?(topic: string, payload: unknown, qos?: number): Promise<void>;
}
