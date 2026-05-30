import { startBridge, stopBridge } from './SerialPortWebSocketBridge';
import { T3D_DEFAULT_WS_CLIENT_URL } from '../websocket/T3DWebSocketConfig';

function getArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith(prefix)) return arg.slice(prefix.length);
  }
  return undefined;
}

async function main(): Promise<void> {
  const wsUrl =
    getArg('url') ?? process.env.T3D_WS_CLIENT_URL ?? T3D_DEFAULT_WS_CLIENT_URL;

  await startBridge({ wsUrl });
  console.log(`[serialport-bridge] connected to ${wsUrl}`);

  const shutdown = async () => {
    console.log('[serialport-bridge] shutting down...');
    await stopBridge();
    process.exit(0);
  };

  process.on('SIGINT', () => {
    void shutdown();
  });
  process.on('SIGTERM', () => {
    void shutdown();
  });
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
