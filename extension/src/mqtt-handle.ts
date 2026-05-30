import * as vscode from 'vscode';
import { AedesMqttBroker } from './mqtt/aedes';
import type { AedesBroker } from './mqtt/aedes';
import { handleBrokerControlMessage } from './broker-control';
import type { WebviewMessage } from './types';

// Module-level broker instance
let mqttBroker: AedesBroker | null = null;

// Control WebSocket clients tracking
let controlClients: Set<any> | null = null;

// Callback to get current panel (set by extension.ts)
let getCurrentPanel: (() => vscode.WebviewPanel | undefined) | null = null;

/**
 * Get the current MQTT broker instance
 */
export function getMqttBroker(): AedesBroker | null {
  return mqttBroker;
}

/**
 * Set callback to get current panel for sending messages
 */
export function setGetCurrentPanelCallback(
  callback: () => vscode.WebviewPanel | undefined
): void {
  getCurrentPanel = callback;
}

/**
 * Initialize MQTT broker (called on extension activation)
 */
export async function initializeMqttBroker(): Promise<void> {
  try {
    // Check if broker already exists and is running
    if (mqttBroker && mqttBroker.isRunning()) {
      console.log(
        '✅ MQTT Broker is already running, reusing existing instance'
      );
      setupMqttEventListeners();
      setupControlWebSocketServer();
      return;
    }

    // Start Aedes MQTT broker
    mqttBroker = new AedesMqttBroker();

    await mqttBroker.start({
      mqttPort: 1883,
      wsPort: 8883,
    });

    // Set up broker event listeners for webview updates
    setupMqttEventListeners();

    // Show notification about broker start (auto-closes after 3 seconds)
    vscode.window.setStatusBarMessage(
      'MQTT Broker started (MQTT: 1883, WS: 8883)',
      3000
    );

    // Set up control WebSocket server
    setupControlWebSocketServer();
  } catch (error: any) {
    // Handle port already in use error
    if (error?.code === 'EADDRINUSE') {
      const errorMessage = `MQTT Broker: Port already in use. The broker may already be running from a previous session.`;
      console.warn('⚠️', errorMessage);
      // Show info message instead of error (less alarming since it's handled gracefully)
      vscode.window.showInformationMessage(errorMessage);

      // Try to clean up
      if (mqttBroker) {
        try {
          mqttBroker.stop();
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
        mqttBroker = null;
      }
    } else {
      const errorMessage = `MQTT Broker failed to start: ${error?.message || error}`;
      console.error('❌', errorMessage);
      vscode.window.showErrorMessage(errorMessage);
    }
  }
}

/**
 * Start MQTT broker (command handler)
 */
export async function startMqttBroker(): Promise<void> {
  if (mqttBroker && mqttBroker.isRunning()) {
    vscode.window.setStatusBarMessage('MQTT Broker is already running', 3000);
    return;
  }

  try {
    if (!mqttBroker) {
      // Create new broker instance
      mqttBroker = new AedesMqttBroker();
    }

    await mqttBroker.start({
      mqttPort: 1883,
      wsPort: 8883,
    });

    // Set up broker event listeners for webview updates
    setupMqttEventListeners();

    // Show notification about broker start (auto-closes after 3 seconds)
    vscode.window.setStatusBarMessage(
      'MQTT Broker started (MQTT: 1883, WS: 8883)',
      3000
    );

    // Set up control WebSocket server
    setupControlWebSocketServer();
  } catch (error: any) {
    // Handle port already in use error
    if (error?.code === 'EADDRINUSE') {
      const errorMessage = `MQTT Broker failed to start: Port already in use. Please restart VS Code or stop the existing broker.`;
      console.error('❌', errorMessage);
      vscode.window.showErrorMessage(errorMessage);
    } else {
      const errorMessage = `MQTT Broker failed to start: ${error?.message || error}`;
      console.error('❌', errorMessage);
      vscode.window.showErrorMessage(errorMessage);
    }
  }
}

/**
 * Set up MQTT broker event listeners
 */
function setupMqttEventListeners(): void {
  if (!mqttBroker) return;

  const brokerAny = mqttBroker as any;

  brokerAny.on('clients-changed', (clients: any) => {
    // Forward to webview when panel is available
    const panel = getCurrentPanel?.();
    if (panel) {
      panel.webview.postMessage({
        type: 'mqtt-clients-changed',
        clients,
      });
    }
  });

  brokerAny.on('status-changed', (status: any) => {
    // Forward to webview when panel is available
    const panel = getCurrentPanel?.();
    if (panel) {
      panel.webview.postMessage({
        type: 'mqtt-status-changed',
        status,
      });
    }
  });
}

/**
 * Set up control WebSocket server
 */
function setupControlWebSocketServer(): void {
  if (!mqttBroker) return;

  const controlWs = mqttBroker.getControlWsServer();
  controlClients = new Set<any>();

  if (controlWs) {
    controlWs.on('connection', (ws: any) => {
      console.log('🎛️ Control API client connected');
      controlClients!.add(ws);

      ws.on('message', (msg: any) => {
        try {
          const message = JSON.parse(msg.toString());
          handleBrokerControlMessage(ws, message, mqttBroker!);
        } catch (err) {
          console.error('❌ Control message parse error:', err);
        }
      });

      ws.on('close', () => {
        console.log('🎛️ Control API client disconnected');
        controlClients!.delete(ws);
      });
    });

    // Listen for port changes from broker
    const brokerAny = mqttBroker as any;
    brokerAny.on('ports-changed', (ports: any) => {
      console.log('📢 Broadcasting port change to all control clients');

      // Broadcast to all WebSocket control clients
      controlClients!.forEach((client) => {
        client.send(
          JSON.stringify({
            type: 'ports-changed-broadcast',
            data: ports,
          })
        );
      });

      // Send to VSCode webview
      const panel = getCurrentPanel?.();
      if (panel) {
        sendPortsChanged(panel, ports.mqttPort, ports.wsPort);
      }
    });
  }
}

/**
 * Handle MQTT-related webview messages
 */
export function handleMqttWebviewMessage(
  message: WebviewMessage,
  panel: vscode.WebviewPanel
): boolean {
  // Returns true if message was handled, false otherwise
  switch (message.type) {
    case 'mqtt-connect':
      // Broker is already running, just send status
      sendBrokerStatus(panel);
      return true;

    case 'mqtt-restart':
      if (mqttBroker) {
        vscode.window.setStatusBarMessage('Restarting MQTT Broker...', 3000);
        mqttBroker
          .restart()
          .then(() => {
            sendBrokerStatus(panel);
            sendBrokerRestarted(panel);
            vscode.window.setStatusBarMessage(
              'MQTT Broker restarted successfully',
              3000
            );
          })
          .catch((error) => {
            console.error('Failed to restart MQTT broker:', error);
            vscode.window.showErrorMessage(
              `Failed to restart MQTT broker: ${error?.message || error}`
            );
          });
      }
      return true;

    case 'mqtt-get-status':
      sendBrokerStatus(panel);
      return true;

    case 'mqtt-update-ports':
      if (mqttBroker && message.mqttPort && message.wsPort) {
        vscode.window.setStatusBarMessage(
          `Updating ports: MQTT ${message.mqttPort}, WS ${message.wsPort}...`,
          3000
        );
        mqttBroker
          .updatePorts(message.mqttPort, message.wsPort)
          .then(() => {
            sendBrokerStatus(panel);
            vscode.window.setStatusBarMessage(
              'Ports updated successfully',
              3000
            );
          })
          .catch((error) => {
            console.error('Failed to update ports:', error);
            vscode.window.showErrorMessage(
              `Failed to update ports: ${error?.message || error}`
            );
          });
      }
      return true;

    case 'mqtt-get-clients':
      if (mqttBroker) {
        const clients = mqttBroker.getClientList();
        panel.webview.postMessage({
          type: 'mqtt-clients',
          clients,
        });
      }
      return true;

    case 'mqtt-publish':
    case 'mqtt-subscribe':
    case 'mqtt-unsubscribe':
      // These are now handled directly by the webview connecting to the embedded broker
      return true;

    case 'mqtt-save-config':
      if (message.config) {
        const config = vscode.workspace.getConfiguration('ternion.mqtt');
        config.update(
          'configuration',
          message.config,
          vscode.ConfigurationTarget.Global
        );
      }
      return true;

    case 'mqtt-load-config':
      {
        const config = vscode.workspace.getConfiguration('ternion.mqtt');
        const savedConfig = config.get('configuration');
        panel.webview.postMessage({
          type: 'mqtt-config-loaded',
          config: savedConfig || null,
        });
      }
      return true;

    case 'mqtt-clear-config':
      {
        const config = vscode.workspace.getConfiguration('ternion.mqtt');
        config.update(
          'configuration',
          undefined,
          vscode.ConfigurationTarget.Global
        );
      }
      return true;

    default:
      return false;
  }
}

/**
 * Send broker status to webview
 */
export function sendBrokerStatus(panel: vscode.WebviewPanel): void {
  if (mqttBroker) {
    const status = mqttBroker.getStatus();
    panel.webview.postMessage({
      type: 'mqtt-status',
      status,
    });
  }
}

/**
 * Send ports changed notification to webview
 */
export function sendPortsChanged(
  panel: vscode.WebviewPanel,
  mqttPort: number,
  wsPort: number
): void {
  panel.webview.postMessage({
    type: 'mqtt-ports-changed',
    mqttPort,
    wsPort,
  });
}

/**
 * Send broker restarted notification to webview
 */
export function sendBrokerRestarted(panel: vscode.WebviewPanel): void {
  panel.webview.postMessage({
    type: 'mqtt-restarted',
  });
}

/**
 * Stop MQTT broker
 */
export function stopMqttBroker(): void {
  if (!mqttBroker) {
    vscode.window.setStatusBarMessage('MQTT Broker is not running', 3000);
    return;
  }

  if (!mqttBroker.isRunning()) {
    vscode.window.setStatusBarMessage('MQTT Broker is already stopped', 3000);
    return;
  }

  vscode.window.setStatusBarMessage('Stopping MQTT Broker...', 3000);
  mqttBroker.stop();
  mqttBroker = null;

  if (controlClients) {
    controlClients.clear();
    controlClients = null;
  }

  vscode.window.setStatusBarMessage('MQTT Broker stopped', 3000);
}
