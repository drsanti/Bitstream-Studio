import type { Duplex } from 'stream';

export type Broker = {
  handle: (stream: Duplex) => unknown;
  close: (callback?: () => void) => void;
  clients: Map<string, any>;
};

export interface AedesBrokerConfig {
  mqttPort?: number;
  wsPort?: number;
}

export interface BrokerStatus {
  running: boolean;
  mqttPort: number | null;
  wsPort: number | null;
  uptime: number;
  connections: number;
}

export interface ClientInfo {
  id: string;
  connected: boolean;
  protocol: 'tcp' | 'ws';
}

export interface AedesBroker {
  // Lifecycle
  start(config?: AedesBrokerConfig): Promise<void>;
  stop(): void;
  restart(config?: AedesBrokerConfig): Promise<void>;

  // Status & Info
  isRunning(): boolean;
  getStatus(): BrokerStatus;
  getConfig(): AedesBrokerConfig;

  // Runtime Configuration
  updatePorts(mqttPort?: number, wsPort?: number): Promise<void>;

  // Statistics
  getConnectionCount(): number;
  getClientList(): ClientInfo[];

  // Control WebSocket
  getControlWsServer(): any;

  // EventEmitter methods
  on(event: 'error', listener: (error: any) => void): this;
  on(event: 'clients-changed', listener: (clients: ClientInfo[]) => void): this;
  on(event: 'status-changed', listener: (status: BrokerStatus) => void): this;
  on(
    event: 'ports-changed',
    listener: (ports: { mqttPort: number; wsPort: number }) => void
  ): this;
  on(event: string, listener: (...args: any[]) => void): this;
}
