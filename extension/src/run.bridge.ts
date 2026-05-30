import { startBridge, stopBridge } from './serialport-bridge/SerialPortWebSocketBridge';
import {
  startModelDownloaderBridge,
  stopModelDownloaderBridge,
} from './model-downloader/ModelDownloaderWebSocketBridge';
import { T3D_DEFAULT_WS_CLIENT_URL } from './websocket/T3DWebSocketConfig';

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

  try {
    await startModelDownloaderBridge({ wsUrl });
    console.log(`[model-downloader-bridge] connected to ${wsUrl}`);
  } catch (err) {
    console.error('[model-downloader-bridge] failed to start:', err);
  }

  const shutdown = async () => {
    console.log('[bridge] shutting down...');
    await stopModelDownloaderBridge();
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
