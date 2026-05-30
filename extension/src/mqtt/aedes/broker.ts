import aedesPkg from 'aedes';
import { createServer } from 'net';
import { createServer as createHttpServer } from 'http';
import { WebSocketServer, createWebSocketStream } from 'ws';
import { EventEmitter } from 'events';
import { networkInterfaces } from 'os';
import type { Duplex } from 'stream';

/**
 * Check if a port is available
 */
function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(true); // Other errors, assume port might be available
      }
    });
    server.once('listening', () => {
      server.close(() => {
        resolve(true);
      });
    });
    server.listen(port);
  });
}
import type {
  Broker,
  AedesBroker,
  AedesBrokerConfig,
  BrokerStatus,
  ClientInfo,
} from './types';

const DEFAULT_MQTT_PORT = 1883;
const DEFAULT_WS_PORT = 8883;
const DEFAULT_CONTROL_PORT = 9999;

const getIpAddr = (): string => {
  const ips: string[] = [];
  const interfaces = networkInterfaces();
  for (const interfaceName in interfaces) {
    const addresses = interfaces[interfaceName];
    if (addresses) {
      for (const address of addresses) {
        if (address.family === 'IPv4' && !address.internal) {
          ips.push(address.address);
        }
      }
    }
  }
  return ips[0] || 'localhost';
};

class AedesMqttBroker extends EventEmitter implements AedesBroker {
  private broker: Broker | null = null;
  private mqttServer: ReturnType<typeof createServer> | null = null;
  private httpServer: ReturnType<typeof createHttpServer> | null = null;
  private wsServer: WebSocketServer | null = null;
  private controlWsServer: WebSocketServer | null = null;
  private config: AedesBrokerConfig = {
    mqttPort: DEFAULT_MQTT_PORT,
    wsPort: DEFAULT_WS_PORT,
  };
  private startTime: number | null = null;
  private startError: Error | null = null;

  constructor() {
    super();
  }

  async start(config?: AedesBrokerConfig): Promise<void> {
    if (this.isRunning()) {
      console.warn('Broker is already running');
      return;
    }

    this.config = { ...this.config, ...config };
    const { mqttPort, wsPort } = this.config;
    this.startError = null;

    // Check if ports are available before starting
    const mqttPortAvailable = await isPortAvailable(mqttPort!);
    const wsPortAvailable = await isPortAvailable(wsPort!);
    const controlPortAvailable = await isPortAvailable(DEFAULT_CONTROL_PORT);

    if (!mqttPortAvailable || !wsPortAvailable || !controlPortAvailable) {
      const unavailablePorts: string[] = [];
      if (!mqttPortAvailable) unavailablePorts.push(`MQTT:${mqttPort}`);
      if (!wsPortAvailable) unavailablePorts.push(`WS:${wsPort}`);
      if (!controlPortAvailable)
        unavailablePorts.push(`Control:${DEFAULT_CONTROL_PORT}`);

      const error = new Error(
        `Ports already in use: ${unavailablePorts.join(', ')}. Another broker instance may be running.`
      ) as NodeJS.ErrnoException;
      error.code = 'EADDRINUSE';
      this.startError = error;
      this.emit('error', error);
      throw error;
    }

    // Initialize Aedes MQTT broker
    const { createBroker } = aedesPkg as unknown as {
      createBroker: () => Broker;
    };
    this.broker = createBroker();

    // Add event listeners to track client connections
    const brokerAny = this.broker as any;

    brokerAny.on('client', (client: any) => {
      console.log('✅ Client connected:', client.id);
      console.log('🔍 Current client count:', this.getConnectionCount());
      this.emit('clients-changed', this.getClientList());
      this.emit('status-changed', this.getStatus());
    });

    brokerAny.on('clientDisconnect', (client: any) => {
      console.log('❌ Client disconnected:', client.id);
      console.log('🔍 Current client count:', this.getConnectionCount());
      this.emit('clients-changed', this.getClientList());
      this.emit('status-changed', this.getStatus());
    });

    brokerAny.on('clientError', (client: any, err: any) => {
      console.log('⚠️ Client error:', client.id, err);
    });

    brokerAny.on('publish', (packet: any, client: any) => {
      if (client) {
        console.log(
          '📨 Publish from client:',
          client.id,
          'topic:',
          packet.topic
        );
      }
    });

    brokerAny.on('subscribe', (subscriptions: any, client: any) => {
      console.log(
        '📥 Subscribe from client:',
        client.id,
        'topics:',
        subscriptions
      );
    });

    const ipAddr = getIpAddr();

    // Create TCP server for MQTT
    this.mqttServer = createServer((socket) => {
      this.broker?.handle(socket);
    });
    this.mqttServer.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.error(
          `❌ Port ${mqttPort} is already in use. Another MQTT broker instance may be running.`
        );
        console.error(
          '💡 Try stopping the existing broker or restart VS Code to clean up ports.'
        );
        this.startError = err;
        this.emit('error', err);
        // Clean up partial state
        this.stop();
      } else {
        console.error('❌ MQTT server error:', err);
        this.startError = err;
        this.emit('error', err);
      }
    });
    this.mqttServer.listen(mqttPort!, () => {
      console.log(`\n🚀 MQTT (TCP):`);
      console.log(`   ✅ mqtt://localhost:${mqttPort}`);
      console.log(`   ✅ mqtt://${ipAddr}:${mqttPort}`);
    });

    // Create HTTP server for WebSocket MQTT
    this.httpServer = createHttpServer();
    // IMPORTANT: Explicitly negotiate MQTT WebSocket subprotocol.
    // Many MQTT-over-WebSocket clients (e.g. mqtt.js in browser/webview) request `Sec-WebSocket-Protocol: mqtt`
    // and will drop the connection if the server does not select/echo an accepted subprotocol.
    this.wsServer = new WebSocketServer({
      server: this.httpServer,
      handleProtocols: (protocols) => {
        // `protocols` can be a Set<string> (ws) or string[] depending on versions/typings
        const list = Array.isArray(protocols)
          ? protocols
          : Array.from(protocols as unknown as Set<string>);

        if (list.includes('mqtt')) return 'mqtt';
        // Accept common variants if present (be permissive; aedes will validate MQTT bytes itself)
        if (list.includes('mqttv5')) return 'mqttv5';
        if (list.includes('mqttv3.1')) return 'mqttv3.1';
        if (list.includes('mqttv3.1.1')) return 'mqttv3.1.1';
        return false;
      },
    });
    this.wsServer.on('connection', (ws) => {
      const stream = createWebSocketStream(ws) as unknown as Duplex;
      this.broker?.handle(stream);
    });
    this.httpServer.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.error(
          `❌ Port ${wsPort} is already in use. Another WebSocket server may be running.`
        );
        console.error(
          '💡 Try stopping the existing broker or restart VS Code to clean up ports.'
        );
        this.startError = err;
        this.emit('error', err);
        // Clean up partial state
        this.stop();
      } else {
        console.error('❌ WebSocket server error:', err);
        this.startError = err;
        this.emit('error', err);
      }
    });
    this.httpServer.listen(wsPort!, () => {
      console.log(`\n🌐 MQTT (WebSocket):`);
      console.log(`   ✅ ws://localhost:${wsPort}`);
      console.log(`   ✅ ws://${ipAddr}:${wsPort}`);
    });

    // Create separate WebSocket server for control API
    this.controlWsServer = new WebSocketServer({ port: DEFAULT_CONTROL_PORT });
    this.controlWsServer.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.error(
          `❌ Control API port ${DEFAULT_CONTROL_PORT} is already in use.`
        );
        console.error(
          '💡 Try stopping the existing broker or restart VS Code to clean up ports.'
        );
        this.startError = err;
        this.emit('error', err);
        // Clean up partial state
        this.stop();
      } else {
        console.error('❌ Control API server error:', err);
        this.startError = err;
        this.emit('error', err);
      }
    });
    this.controlWsServer.on('listening', () => {
      console.log(`\n🎛️ Control API (WebSocket):`);
      console.log(`   ✅ ws://localhost:${DEFAULT_CONTROL_PORT}`);
      console.log(`   ✅ ws://${ipAddr}:${DEFAULT_CONTROL_PORT}`);
    });

    this.startTime = Date.now();
  }

  stop(): void {
    try {
      if (this.controlWsServer) {
        this.controlWsServer.close((err) => {
          if (err) {
            console.warn('⚠️ Error closing control WebSocket server:', err);
          }
        });
        this.controlWsServer = null;
      }
      if (this.wsServer) {
        this.wsServer.close((err) => {
          if (err) {
            console.warn('⚠️ Error closing WebSocket server:', err);
          }
        });
        this.wsServer = null;
      }
      if (this.httpServer) {
        this.httpServer.close((err) => {
          if (err) {
            console.warn('⚠️ Error closing HTTP server:', err);
          }
        });
        this.httpServer = null;
      }
      if (this.mqttServer) {
        this.mqttServer.close((err) => {
          if (err) {
            console.warn('⚠️ Error closing MQTT server:', err);
          }
        });
        this.mqttServer = null;
      }
      if (this.broker) {
        this.broker.close(() => {
          console.log('✅ Aedes broker closed');
        });
        this.broker = null;
      }
      this.startTime = null;
    } catch (error) {
      console.error('❌ Error stopping broker:', error);
    }
  }

  getControlWsServer(): WebSocketServer | null {
    return this.controlWsServer;
  }

  async restart(config?: AedesBrokerConfig): Promise<void> {
    console.log('Restarting MQTT broker...');
    this.stop();

    // Wait a moment for cleanup
    await new Promise((resolve) => setTimeout(resolve, 500));
    await this.start(config || this.config);
  }

  isRunning(): boolean {
    return this.broker !== null;
  }

  getStatus(): BrokerStatus {
    return {
      running: this.isRunning(),
      mqttPort: this.isRunning() ? this.config.mqttPort! : null,
      wsPort: this.isRunning() ? this.config.wsPort! : null,
      uptime: this.startTime ? Date.now() - this.startTime : 0,
      connections: this.getConnectionCount(),
    };
  }

  getConfig(): AedesBrokerConfig {
    return { ...this.config };
  }

  async updatePorts(mqttPort?: number, wsPort?: number): Promise<void> {
    if (this.isRunning()) {
      // Store the new port values before restart
      const newMqttPort = mqttPort || this.config.mqttPort;
      const newWsPort = wsPort || this.config.wsPort;

      // Restart with new ports
      await this.restart({
        mqttPort: newMqttPort,
        wsPort: newWsPort,
      });

      // Emit port change event with the NEW port values
      this.emit('ports-changed', {
        mqttPort: newMqttPort,
        wsPort: newWsPort,
      });
      this.emit('status-changed', this.getStatus());
    } else {
      // Update config for next start
      if (mqttPort) this.config.mqttPort = mqttPort;
      if (wsPort) this.config.wsPort = wsPort;
    }
  }

  getConnectionCount(): number {
    if (!this.broker) {
      console.log('⚠️ Broker is null');
      return 0;
    }

    // Log the entire broker structure to find where clients are stored
    const brokerAny = this.broker as any;
    // console.log("🔍 Broker properties:", Object.keys(brokerAny));
    // console.log("🔍 Broker.clients:", brokerAny.clients);
    // console.log("🔍 Broker.connectedClients:", brokerAny.connectedClients);

    // Try different possible client storage locations
    let clients = brokerAny.clients;

    if (!clients) {
      console.log(
        '⚠️ broker.clients is null/undefined, trying alternatives...'
      );

      // Check if clients are stored differently
      if (brokerAny.connectedClients) {
        clients = brokerAny.connectedClients;
        console.log('📍 Found connectedClients');
      } else if (brokerAny._clients) {
        clients = brokerAny._clients;
        console.log('📍 Found _clients');
      } else {
        console.log('❌ No clients found anywhere');
        return 0;
      }
    }

    // console.log("🔍 Clients object type:", typeof clients);
    // console.log("🔍 Clients object:", clients);
    // console.log("🔍 Clients constructor:", clients.constructor?.name);

    // If it's a Map
    if (
      clients instanceof Map ||
      (clients.size !== undefined && typeof clients.forEach === 'function')
    ) {
      console.log('✅ Using Map.size:', clients.size);
      return clients.size;
    }

    // If it's an object
    if (typeof clients === 'object') {
      const keys = Object.keys(clients);
      // console.log("🔍 Object.keys:", keys);
      // console.log("✅ Using Object.keys.length:", keys.length);
      return keys.length;
    }

    console.log('❌ Unknown client storage type');
    return 0;
  }

  getClientList(): ClientInfo[] {
    if (!this.broker || !this.broker.clients) {
      return [];
    }

    const clients: ClientInfo[] = [];
    const clientsObj = this.broker.clients as any;

    // Handle both Map and object structures
    if (clientsObj.forEach && typeof clientsObj.forEach === 'function') {
      // It's a Map or has forEach
      clientsObj.forEach((client: any, id: string) => {
        clients.push({
          id: id || client.id || 'unknown',
          connected: client.connected !== false, // Default to true if not explicitly false
          protocol: this._detectProtocol(client),
        });
      });
    } else {
      // It's a plain object
      Object.keys(clientsObj).forEach((id: string) => {
        const client = clientsObj[id];
        clients.push({
          id: id || client.id || 'unknown',
          connected: client.connected !== false,
          protocol: this._detectProtocol(client),
        });
      });
    }

    return clients;
  }

  private _detectProtocol(client: any): 'tcp' | 'ws' {
    // Try to detect WebSocket connections
    // WebSocket connections typically have a different stream type
    if (client.conn) {
      const connType = client.conn.constructor?.name || '';
      if (connType.includes('WebSocket') || connType.includes('Duplex')) {
        return 'ws';
      }
    }
    // Check if the stream is a WebSocket stream
    if (client.stream?._ws || client.stream?.ws) {
      return 'ws';
    }
    // Default to TCP
    return 'tcp';
  }
}

export { AedesMqttBroker };
