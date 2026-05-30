/**
 * Keeps the **model** WebSocket broker (default 9999) available for browser mode (Model Loader,
 * Free Loader, catalog). Serial/bitstream uses `ternion.ws.brokerPort` (default 9998) separately.
 * Binds 127.0.0.1 when the model port is free; if in use (e.g. combined bridge), only starts the
 * in-process downloader client.
 */

import * as vscode from "vscode";
import { T3DWebSocketServer } from "./websocket/T3DWebSocketServer";
import { resolveBrokerMonitorIncludePublishesFromEnv } from "./websocket/T3DWebSocketConfig";
import {
  startModelDownloaderBridge,
  stopModelDownloaderBridge,
} from "./model-downloader/ModelDownloaderWebSocketBridge";

let ownedBroker: T3DWebSocketServer | null = null;
/** True after we attempted once to bind the local broker (success or EADDRINUSE). */
let attemptedLocalBroker = false;
let ensurePromise: Promise<void> | null = null;

function isEaddrinuse(e: unknown): boolean {
  const err = e as NodeJS.ErrnoException | undefined;
  return err?.code === "EADDRINUSE";
}

function getModelBrokerPort(): number {
  return vscode.workspace.getConfiguration("ternion.ws").get<number>("modelBrokerPort", 9999);
}

function getModelBrokerClientUrl(): string {
  return `ws://127.0.0.1:${getModelBrokerPort()}`;
}

export async function ensureEmbeddedModelLoaderBroker(): Promise<void> {
  if (ensurePromise) {
    return ensurePromise;
  }

  ensurePromise = (async () => {
    if (!attemptedLocalBroker) {
      const srv = new T3DWebSocketServer({
        port: getModelBrokerPort(),
        host: "127.0.0.1",
        brokerMonitorIncludePublishes: resolveBrokerMonitorIncludePublishesFromEnv(),
      });
      try {
        await srv.start();
        ownedBroker = srv;
        attemptedLocalBroker = true;
      } catch (e) {
        if (isEaddrinuse(e)) {
          attemptedLocalBroker = true;
        } else {
          throw e;
        }
      }
    }

    await startModelDownloaderBridge({ wsUrl: getModelBrokerClientUrl() });
  })().finally(() => {
    ensurePromise = null;
  });

  return ensurePromise;
}

export async function stopEmbeddedModelLoaderBroker(): Promise<void> {
  ensurePromise = null;
  await stopModelDownloaderBridge();
  if (ownedBroker) {
    ownedBroker.stop();
    ownedBroker = null;
  }
  attemptedLocalBroker = false;
}
