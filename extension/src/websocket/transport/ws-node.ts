import type { WsTransport, WsReadyState } from './types';

/**
 * Node.js WebSocket transport using `ws` package.
 * Uses dynamic import to avoid pulling `ws` into browser bundles.
 */
export class WsNodeTransport implements WsTransport {
  private ws: any = null; // WebSocket from 'ws' package
  private wsModule: any = null; // Lazy-loaded 'ws' module

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
    if (this.ws && (this.ws.readyState === 1 || this.ws.readyState === 0)) {
      return; // Already connected or connecting
    }
    // If ws exists but is closed, reset it for reconnection
    if (this.ws && this.ws.readyState === 3) {
      this.ws = null;
    }

    // Lazy load 'ws' module
    if (!this.wsModule) {
      this.wsModule = await import('ws');
    }

    return new Promise<void>((resolve, reject) => {
      const WebSocket = this.wsModule.default || this.wsModule;
      this.ws = new WebSocket(this.url);

      let resolved = false;

      this.ws.on('open', () => {
        this.onOpen?.();
        if (!resolved) {
          resolved = true;
          resolve();
        }
      });

      this.ws.on('message', (data: any, isBinary: boolean) => {
        if (isBinary) {
          // Convert Buffer to Uint8Array
          const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
          this.onMessage?.(new Uint8Array(buf), true);
        } else {
          const text = typeof data === 'string' ? data : Buffer.from(data).toString('utf8');
          this.onMessage?.(text, false);
        }
      });

      this.ws.on('error', (err: any) => {
        const error = err instanceof Error ? err : new Error(String(err));
        this.onError?.(error);
        if (!resolved) {
          resolved = true;
          reject(error);
        }
      });

      this.ws.on('close', () => {
        this.onClose?.();
      });
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
    if (!this.ws || this.ws.readyState !== 1) return; // OPEN
    try {
      this.ws.send(text);
    } catch (err) {
      this.onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }

  sendBinary(data: Uint8Array): void {
    if (!this.ws || this.ws.readyState !== 1) return; // OPEN
    try {
      // Node 'ws' accepts Buffer, which Uint8Array is compatible with
      this.ws.send(data, { binary: true });
    } catch (err) {
      this.onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
