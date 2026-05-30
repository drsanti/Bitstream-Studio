import type { WsTransport, WsReadyState } from './types';

/**
 * Browser/WebView WebSocket transport using native `WebSocket`.
 * Works in browser and VS Code webview contexts.
 */
export class WsBrowserTransport implements WsTransport {
  private ws: WebSocket | null = null;

  constructor(private url: string) {}

  get readyState(): WsReadyState {
    if (!this.ws) return 3; // CLOSED
    return this.ws.readyState as WsReadyState;
  }

  onOpen?: () => void;
  onMessage?: (data: string | Uint8Array, isBinary: boolean) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;

  async connect(): Promise<void> {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return; // Already connected or connecting
    }
    // If ws exists but is closed, reset it for reconnection
    if (this.ws && this.ws.readyState === WebSocket.CLOSED) {
      this.ws = null;
    }

    return new Promise<void>((resolve, reject) => {
      this.ws = new WebSocket(this.url);
      this.ws.binaryType = 'arraybuffer'; // Ensure binary messages come as ArrayBuffer

      let resolved = false;

      this.ws.onopen = () => {
        this.onOpen?.();
        if (!resolved) {
          resolved = true;
          resolve();
        }
      };

      this.ws.onmessage = (event: MessageEvent) => {
        const data = event.data;
        if (typeof data === 'string') {
          this.onMessage?.(data, false);
        } else if (data instanceof ArrayBuffer) {
          this.onMessage?.(new Uint8Array(data), true);
        } else if (data instanceof Blob) {
          // Convert Blob to ArrayBuffer, then to Uint8Array
          data.arrayBuffer().then((ab) => {
            this.onMessage?.(new Uint8Array(ab), true);
          }).catch((err) => {
            this.onError?.(err instanceof Error ? err : new Error(String(err)));
          });
        } else {
          // Fallback: try to convert to Uint8Array
          try {
            const arr = new Uint8Array(data as any);
            this.onMessage?.(arr, true);
          } catch {
            this.onError?.(new Error('Unsupported message data type'));
          }
        }
      };

      this.ws.onerror = (event: Event) => {
        const error = new Error('WebSocket error');
        this.onError?.(error);
        if (!resolved) {
          resolved = true;
          reject(error);
        }
      };

      this.ws.onclose = () => {
        this.onClose?.();
      };
    });
  }

  close(): void {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }
  }

  sendText(text: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    try {
      this.ws.send(text);
    } catch (err) {
      this.onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }

  sendBinary(data: Uint8Array): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    try {
      this.ws.send(data);
    } catch (err) {
      this.onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
