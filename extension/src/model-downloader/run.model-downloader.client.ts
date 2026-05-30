import { T3DWebSocketClient } from "../websocket/T3DWebSocketClient";
import { T3D_MODEL_LOADER_WS_CLIENT_URL } from "../websocket/T3DWebSocketConfig";
import {
  MODEL_DOWNLOADER_TOPICS,
  type ListResponse,
  type InfoResponse,
  type DownloadResponse,
  type DownloadProgressPayload,
  type ModelDownloaderRequestConfig,
} from "./protocol";

const DEFAULT_REQUEST_TIMEOUT_MS = 60000;
const DOWNLOAD_REQUEST_TIMEOUT_MS = 300000;

function getArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith(prefix)) return arg.slice(prefix.length);
  }
  return undefined;
}

function nextRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getConfig(): {
  wsUrl: string;
  baseUrl: string;
  apiKey: string;
  productId: string;
  outputDir: string;
} {
  return {
    wsUrl:
      getArg("url") ??
      process.env.T3D_MODEL_BROKER_WS_CLIENT_URL ??
      process.env.T3D_WS_CLIENT_URL ??
      T3D_MODEL_LOADER_WS_CLIENT_URL,
    baseUrl:
      getArg("baseUrl") ??
      process.env.TESAIOT_BASE_URL ??
      "https://admin.tesaiot.com",
    apiKey:
      getArg("apiKey") ??
      process.env.TESAIOT_DIGITAL_TWIN_APIKEY ??
      "",
    productId: getArg("productId") ?? "PDM-EVM-682847",
    outputDir: getArg("out") ?? "./downloads",
  };
}

type PendingEntry = {
  resolve: (v: unknown) => void;
  reject: (e: Error) => void;
  timeoutId: ReturnType<typeof setTimeout>;
};

async function createClientSession(wsUrl: string): Promise<{
  client: T3DWebSocketClient;
  sendRequest: <T>(
    topic: string,
    payload: Record<string, unknown>,
    options?: { timeoutMs?: number }
  ) => Promise<T>;
}> {
  const pending = new Map<string, PendingEntry>();

  const client = new T3DWebSocketClient(
    { url: wsUrl, autoConnect: false },
    {
      onConnect: () => console.log("[model-downloader-client] Connected"),
      onDisconnect: () =>
        console.log("[model-downloader-client] Disconnected"),
      onError: (err) =>
        console.error("[model-downloader-client] Error:", err.message),
      onMessage: (topic, payload) => {
        if (topic === MODEL_DOWNLOADER_TOPICS.DOWNLOAD_PROGRESS) {
          const p = payload as DownloadProgressPayload;
          console.log(
            `  Progress: ${p.phase} ${p.percent}%${p.label ? ` - ${p.label}` : ""}`
          );
          return;
        }
        const res = payload as { requestId?: string };
        const requestId = res?.requestId;
        const entry = requestId ? pending.get(requestId) : undefined;
        if (!requestId || !entry) return;
        pending.delete(requestId);
        clearTimeout(entry.timeoutId);
        if (topic === MODEL_DOWNLOADER_TOPICS.LIST_RESPONSE) {
          const r = payload as ListResponse;
          if (r.error) entry.reject(new Error(r.error));
          else
            entry.resolve({
              data: r.data ?? [],
              pagination: r.pagination ?? {},
            });
        } else if (topic === MODEL_DOWNLOADER_TOPICS.INFO_RESPONSE) {
          const r = payload as InfoResponse;
          if (r.error) entry.reject(new Error(r.error));
          else entry.resolve(r.modelInfo ?? null);
        } else if (topic === MODEL_DOWNLOADER_TOPICS.DOWNLOAD_RESPONSE) {
          const r = payload as DownloadResponse;
          if (r.error) entry.reject(new Error(r.error));
          else if (r.downloadResult) entry.resolve(r.downloadResult);
          else entry.reject(new Error("No download result"));
        }
      },
    }
  );
  await client.connect();
  await client.subscribe(MODEL_DOWNLOADER_TOPICS.LIST_RESPONSE, 0, "json");
  await client.subscribe(MODEL_DOWNLOADER_TOPICS.INFO_RESPONSE, 0, "json");
  await client.subscribe(MODEL_DOWNLOADER_TOPICS.DOWNLOAD_RESPONSE, 0, "json");
  await client.subscribe(MODEL_DOWNLOADER_TOPICS.DOWNLOAD_PROGRESS, 0, "json");

  const sendRequest = <T>(
    topic: string,
    payload: Record<string, unknown>,
    options?: { timeoutMs?: number }
  ): Promise<T> => {
    const requestId = nextRequestId();
    const timeoutMs = options?.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        const e = pending.get(requestId);
        if (e) {
          pending.delete(requestId);
          reject(new Error("Request timeout"));
        }
      }, timeoutMs);
      pending.set(requestId, {
        resolve: (v) => resolve(v as T),
        reject,
        timeoutId,
      });
      client.publish(topic, { ...payload, requestId }, 0).catch((err) => {
        const e = pending.get(requestId);
        if (e) {
          pending.delete(requestId);
          clearTimeout(timeoutId);
          reject(err);
        }
      });
    });
  };

  return { client, sendRequest };
}

/**
 * Example 1: List models
 */
export async function example1List(): Promise<void> {
  console.log("\n=== Example 1: List Models ===\n");
  const { wsUrl, baseUrl, apiKey } = getConfig();
  if (!apiKey) {
    console.error(
      "API key required. Set TESAIOT_DIGITAL_TWIN_APIKEY or --apiKey="
    );
    process.exit(1);
  }
  const { client, sendRequest } = await createClientSession(wsUrl);
  try {
    const result = await sendRequest<{
      data: unknown[];
      pagination: Record<string, unknown>;
    }>(MODEL_DOWNLOADER_TOPICS.LIST, {
      baseUrl,
      apiKey,
      page: 1,
      limit: 10,
    });
    console.log("List result:", JSON.stringify(result, null, 2));
  } finally {
    await client.disconnect();
  }
}

/**
 * Example 2: Get model info
 */
export async function example2Info(): Promise<void> {
  console.log("\n=== Example 2: Get Model Info ===\n");
  const { wsUrl, baseUrl, apiKey, productId } = getConfig();
  if (!apiKey) {
    console.error(
      "API key required. Set TESAIOT_DIGITAL_TWIN_APIKEY or --apiKey="
    );
    process.exit(1);
  }
  const { client, sendRequest } = await createClientSession(wsUrl);
  try {
    const result = await sendRequest<unknown>(MODEL_DOWNLOADER_TOPICS.INFO, {
      baseUrl,
      apiKey,
      productId,
    });
    console.log("Model info:", JSON.stringify(result, null, 2));
  } finally {
    await client.disconnect();
  }
}

/**
 * Example 3: Download model
 */
export async function example3Download(): Promise<void> {
  console.log("\n=== Example 3: Download Model ===\n");
  const { wsUrl, baseUrl, apiKey, productId, outputDir } = getConfig();
  if (!apiKey) {
    console.error(
      "API key required. Set TESAIOT_DIGITAL_TWIN_APIKEY or --apiKey="
    );
    process.exit(1);
  }
  const config: ModelDownloaderRequestConfig = { baseUrl, apiKey };
  const { client, sendRequest } = await createClientSession(wsUrl);
  try {
    const result = await sendRequest<{
      productId: string;
      downloadedFiles: Array<{ label: string; filepath: string; size: number }>;
      totalSize: number;
      outputDir: string;
    }>(
      MODEL_DOWNLOADER_TOPICS.DOWNLOAD,
      { ...config, productId, outputDir },
      { timeoutMs: DOWNLOAD_REQUEST_TIMEOUT_MS }
    );
    console.log("Download result:", JSON.stringify(result, null, 2));
  } finally {
    await client.disconnect();
  }
}

async function main(): Promise<void> {
  const example = process.argv[2];

  const examples: Record<string, () => Promise<void>> = {
    ex1: example1List,
    ex2: example2Info,
    ex3: example3Download,
  };

  if (example && examples[example]) {
    await examples[example]();
  } else {
    console.log(
      "Usage: npx tsx src/model-downloader/run.model-downloader.client.ts <ex1|ex2|ex3> [options]\n"
    );
    console.log("Examples:");
    console.log("  ex1  - List models");
    console.log("  ex2  - Get model info (default productId: PDM-EVM-682847)");
    console.log("  ex3  - Download model to ./downloads (or --out=)\n");
    console.log("Options: --url=, --baseUrl=, --apiKey=, --productId=, --out=");
    console.log("Env: T3D_WS_CLIENT_URL, TESAIOT_BASE_URL, TESAIOT_DIGITAL_TWIN_APIKEY");
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
