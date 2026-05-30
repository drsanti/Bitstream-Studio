import type { T3DWsClientIdentity } from './T3DWebSocketServer';
import { T3DWebSocketServer } from './T3DWebSocketServer';
import {
  T3D_DEFAULT_WS_HOST,
  T3D_DEFAULT_WS_PORT,
  resolveBrokerMonitorIncludePublishesFromEnv,
} from './T3DWebSocketConfig';

function getArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith(prefix)) return arg.slice(prefix.length);
  }
  return undefined;
}

function parsePort(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

function envTruthy(name: string): boolean {
  const v = process.env[name];
  return v === '1' || v === 'true' || v === 'yes';
}

async function main(): Promise<void> {
  const port = parsePort(
    getArg('port') ?? process.env.T3D_WS_PORT,
    T3D_DEFAULT_WS_PORT
  );
  const host = getArg('host') ?? process.env.T3D_WS_HOST ?? T3D_DEFAULT_WS_HOST;

  const consoleBrokerLog = envTruthy('T3D_WS_CONSOLE_LOG');

  const server = new T3DWebSocketServer({
    port,
    host,
    brokerMonitorIncludePublishes: resolveBrokerMonitorIncludePublishesFromEnv(),
  });

  server.on('error', (err) => console.error('[t3d-ws] error:', err));

  if (consoleBrokerLog) {
    server.on('client-connected', (info) =>
      console.log('[t3d-ws] client-connected:', info)
    );
    server.on('client-disconnected', (info) =>
      console.log('[t3d-ws] client-disconnected:', info)
    );
    server.on('subscription-added', (info) =>
      console.log('[t3d-ws] subscription-added:', info)
    );
    server.on('subscription-removed', (info) =>
      console.log('[t3d-ws] subscription-removed:', info)
    );
    server.on('message-published', (info) => {
      const pub = info.publisher;
      const who =
        pub &&
        [pub.role, pub.name, pub.instance].filter(Boolean).join(' · ');
      const corr = info.correlationId ? ` correlationId=${info.correlationId}` : '';
      const prefix = who ? ` publisher="${who}"` : '';
      console.log(
        `[t3d-ws] message-published:${prefix} topic=${info.topic} channel=${info.channel} qos=${info.qos} session=${info.from ?? '—'}${corr}`
      );
    });
    server.on('client-identified', (ev: { id: string; identity: T3DWsClientIdentity }) => {
      console.log('[t3d-ws] client-identified:', ev.id, ev.identity);
    });
  }

  await server.start();
  console.log(`[t3d-ws] listening on ws://${host}:${port}`);
  if (!consoleBrokerLog) {
    console.log(
      '[t3d-ws] Broker console telemetry suppressed (set T3D_WS_CONSOLE_LOG=1 to enable). UI: subscribe to t3d/broker/monitor.'
    );
  }

  const shutdown = () => {
    console.log('[t3d-ws] shutting down...');
    server.stop();
    // Give ws a moment to close sockets
    setTimeout(() => process.exit(0), 50).unref();
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

if (require.main === module) {
  main().catch((err) => {
    const e = err as { code?: string };
    if (e?.code === "EADDRINUSE") {
      console.error(
        "[t3d-ws] Port already in use. Stop the other process, or run only the bridge:\n  npm run run:model-downloader-bridge"
      );
    } else {
      console.error(err);
    }
    process.exit(1);
  });
}
