import type {
  BrokerStatus,
  ClientInfo,
} from "../mqtt/aedes/types";
import type { ControlMessage, ControlResponse } from "./types";

export class BrokerControlClient {
  private ws: WebSocket | null = null;
  private callbacks = new Map<string, (data: any) => void>();
  private broadcastHandlers = new Map<string, (data: any) => void>();

  constructor(private url: string = "ws://localhost:9999") { }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log("🌐 Connected to broker control API");
        resolve();
      };

      this.ws.onerror = (err) => {
        reject(err);
      };

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);

        // Check if it's a broadcast message
        if (message.type && message.type.includes("broadcast")) {
          const handler = this.broadcastHandlers.get(message.type);
          if (handler) {
            handler(message.data);
          }
          return;
        }

        // Regular response
        const response: ControlResponse = message;
        const callback = this.callbacks.get(response.id);
        if (callback) {
          callback(response.data);
          this.callbacks.delete(response.id);
        }
      };
    });
  }

  onPortsChanged(
    handler: (ports: { mqttPort: number; wsPort: number }) => void
  ) {
    this.broadcastHandlers.set("ports-changed-broadcast", handler);
  }

  onStatusChanged(handler: (status: BrokerStatus) => void) {
    this.broadcastHandlers.set("status-changed-broadcast", handler);
  }

  onClientsChanged(handler: (clients: ClientInfo[]) => void) {
    this.broadcastHandlers.set("clients-changed-broadcast", handler);
  }

  async getStatus(): Promise<BrokerStatus> {
    return this.sendRequest("get-status");
  }

  async restart(): Promise<void> {
    return this.sendRequest("restart");
  }

  async updatePorts(mqttPort: number, wsPort: number): Promise<void> {
    return this.sendRequest("update-ports", { mqttPort, wsPort });
  }

  async getClients(): Promise<ClientInfo[]> {
    return this.sendRequest("get-clients");
  }

  private sendRequest(type: string, data?: any): Promise<any> {
    const id = Math.random().toString(36).substring(2);
    const message: ControlMessage = { id, type: type as any, data };

    return new Promise((resolve, reject) => {
      this.callbacks.set(id, resolve);
      this.ws?.send(JSON.stringify(message));

      setTimeout(() => {
        if (this.callbacks.has(id)) {
          this.callbacks.delete(id);
          reject(new Error("Request timeout"));
        }
      }, 5000);
    });
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}
