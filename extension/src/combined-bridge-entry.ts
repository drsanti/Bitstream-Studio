import { TelemetryProviderGateway } from './bitstream2/telemetry-provider/TelemetryProviderGateway';
import { T3DWebSocketServer } from './websocket/T3DWebSocketServer';
import { startBridge, stopBridge } from './serialport-bridge/SerialPortWebSocketBridge';
import { startModelDownloaderBridge, stopModelDownloaderBridge } from './model-downloader/ModelDownloaderWebSocketBridge';
import {
  T3D_DEFAULT_WS_PORT,
  T3D_DEFAULT_WS_HOST,
  resolveBrokerMonitorIncludePublishesFromEnv,
  resolveModelBrokerListenPortFromEnv,
} from './websocket/T3DWebSocketConfig';

function envTruthy(name: string): boolean {
  const v = process.env[name];
  return v === '1' || v === 'true' || v === 'yes';
}

async function main() {
  console.log('🚀 Starting Combined TERNION Bridge...');

  const serialPort = Number(process.env.T3D_WS_PORT) || T3D_DEFAULT_WS_PORT;
  const modelBrokerPort = resolveModelBrokerListenPortFromEnv();
  const host = process.env.T3D_WS_HOST || T3D_DEFAULT_WS_HOST;

  const monitor = resolveBrokerMonitorIncludePublishesFromEnv();

  const serialServer = new T3DWebSocketServer({
    port: serialPort,
    host,
    brokerMonitorIncludePublishes: monitor,
  });
  serialServer.on('error', (err) => console.error('[t3d-ws-serial] server error:', err));
  if (envTruthy('T3D_WS_CONSOLE_LOG')) {
    serialServer.on('client-connected', (info) =>
      console.log('[t3d-ws-serial] client connected:', info.id),
    );
  }

  let modelServer: T3DWebSocketServer | null = null;
  const samePort = modelBrokerPort === serialPort;

  await serialServer.start();
  console.log(`[t3d-ws-serial] listening on ws://${host}:${serialPort}`);

  if (!samePort) {
    modelServer = new T3DWebSocketServer({
      port: modelBrokerPort,
      host,
      brokerMonitorIncludePublishes: monitor,
    });
    modelServer.on('error', (err) => console.error('[t3d-ws-model] server error:', err));
    if (envTruthy('T3D_WS_CONSOLE_LOG')) {
      modelServer.on('client-connected', (info) =>
        console.log('[t3d-ws-model] client connected:', info.id),
      );
    }
    await modelServer.start();
    console.log(`[t3d-ws-model] listening on ws://${host}:${modelBrokerPort}`);
  } else {
    console.log('[t3d-ws] model broker port equals serial broker port — single server mode');
  }

  if (!envTruthy('T3D_WS_CONSOLE_LOG')) {
    console.log('[t3d-ws] Per-event console logging off (T3D_WS_CONSOLE_LOG=1). Activity UI: topic t3d/broker/monitor');
  }

  const serialWsUrl = process.env.T3D_WS_CLIENT_URL || `ws://127.0.0.1:${serialPort}`;
  const modelWsUrl =
    process.env.T3D_MODEL_BROKER_WS_CLIENT_URL?.trim() ||
    `ws://127.0.0.1:${samePort ? serialPort : modelBrokerPort}`;

  try {
    const externalSim = envTruthy('BITSTREAM2_EXTERNAL_SIM');
    await startBridge({ wsUrl: serialWsUrl, externalSim });
    console.log(
      `[serialport-bridge] connected to ${serialWsUrl}` +
        (externalSim ? ' (BITSTREAM2_EXTERNAL_SIM=1)' : ''),
    );
  } catch (err) {
    console.error('[serialport-bridge] failed to start:', err);
  }

  try {
    await startModelDownloaderBridge({ wsUrl: modelWsUrl });
    console.log(`[model-downloader-bridge] connected to ${modelWsUrl}`);
  } catch (err) {
    console.error('[model-downloader-bridge] failed to start:', err);
  }

  let telemetryGateway: TelemetryProviderGateway | null = null;
  if (!envTruthy('BITSTREAM_TELEMETRY_PROVIDER_DISABLE')) {
    try {
      telemetryGateway = new TelemetryProviderGateway({ brokerUrl: serialWsUrl });
      await telemetryGateway.start();
    } catch (err) {
      console.error(
        '[telemetry-provider] failed to start (standalone HTML on :9997 unavailable):',
        err,
      );
    }
  } else {
    console.log('[telemetry-provider] disabled (BITSTREAM_TELEMETRY_PROVIDER_DISABLE=1)');
  }

  const shutdown = async () => {
    console.log('\n🛑 Shutting down bridges...');
    await telemetryGateway?.stop();
    await stopBridge();
    await stopModelDownloaderBridge();
    serialServer.stop();
    modelServer?.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Failed to start combined bridge:', err);
  process.exit(1);
});
