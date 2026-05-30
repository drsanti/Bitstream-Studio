import { WebSocket } from 'ws';
import type { WebSocketServer } from 'ws';
import type { AedesBroker } from '../mqtt/aedes';
import type { ControlMessage, ControlResponse } from './types';
import type {
  BrokerStatus,
  ClientInfo,
} from '../mqtt/aedes/types';

export function handleBrokerControlMessage(
  ws: WebSocket,
  message: ControlMessage,
  broker: AedesBroker
) {
  const { id, type, data } = message;

  try {
    let responseData: any;

    switch (type) {
      case 'get-status':
        responseData = broker.getStatus();
        break;

      case 'restart':
        broker.restart().catch((error) => {
          console.error('Failed to restart MQTT broker:', error);
        });
        responseData = { success: true };
        break;

      case 'stop':
        broker.stop();
        responseData = { success: true };
        break;

      case 'update-ports':
        broker.updatePorts(data.mqttPort, data.wsPort).catch((error) => {
          console.error('Failed to update ports:', error);
        });
        responseData = { success: true };
        break;

      case 'get-clients':
        responseData = broker.getClientList();
        break;

      default:
        throw new Error(`Unknown control message type: ${type}`);
    }

    const response: ControlResponse = { id, data: responseData };
    ws.send(JSON.stringify(response));

    console.log(`📤 Control response sent: ${type}`);
  } catch (error: any) {
    const response: ControlResponse = {
      id,
      data: null,
      error: error.message,
    };
    ws.send(JSON.stringify(response));
    console.error(`❌ Control message error: ${type}`, error);
  }
}

export function setupBrokerEventBroadcasting(
  wsServer: WebSocketServer,
  broker: AedesBroker
) {
  const brokerAny = broker as any;

  brokerAny.on('status-changed', (status: BrokerStatus) => {
    wsServer.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: 'status-changed-broadcast',
            data: status,
          })
        );
      }
    });
  });

  brokerAny.on('clients-changed', (clients: ClientInfo[]) => {
    wsServer.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: 'clients-changed-broadcast',
            data: clients,
          })
        );
      }
    });
  });

  brokerAny.on(
    'ports-changed',
    (ports: { mqttPort: number; wsPort: number }) => {
      wsServer.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              type: 'ports-changed-broadcast',
              data: ports,
            })
          );
        }
      });
    }
  );
}
