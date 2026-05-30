/**
 * Platform-agnostic WebSocket transport interface.
 * Implementations wrap Node `ws` or browser `WebSocket`.
 */

export type WsReadyState = 0 | 1 | 2 | 3; // CONNECTING, OPEN, CLOSING, CLOSED

export interface WsTransport {
  /**
   * Current ready state (0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED)
   */
  readonly readyState: WsReadyState;

  /**
   * Connect to the WebSocket server.
   */
  connect(): Promise<void>;

  /**
   * Close the connection.
   */
  close(): void;

  /**
   * Send text (JSON) message.
   */
  sendText(text: string): void;

  /**
   * Send binary message.
   */
  sendBinary(data: Uint8Array): void;

  /**
   * Event handlers
   */
  onOpen?: () => void;
  onMessage?: (data: string | Uint8Array, isBinary: boolean) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
}
