import { AedesMqttBroker } from '../mqtt/aedes';

function parsePort(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    throw new Error(`Invalid ${name} value "${raw}"`);
  }
  return parsed;
}

async function run(): Promise<void> {
  const mqttPort = parsePort('T3D_MQTT_PORT', 1883);
  const wsPort = parsePort('T3D_MQTT_WS_PORT', 8883);
  const broker = new AedesMqttBroker();

  await broker.start({ mqttPort, wsPort });
  console.log(
    `[run-mqtt-broker] Running (mqtt:${mqttPort}, ws:${wsPort}, control:9999). Press Ctrl+C to stop.`
  );

  const shutdown = () => {
    console.log('[run-mqtt-broker] Shutting down broker...');
    broker.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

run().catch((error) => {
  console.error(
    `[run-mqtt-broker] ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(1);
});
