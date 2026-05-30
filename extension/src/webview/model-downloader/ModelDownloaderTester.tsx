import React, { useCallback, useEffect, useRef, useState } from "react";
import { getModelLoaderWsClientUrl } from "../runtimeWsUrls";
import { useModelDownloaderOverWs } from "./useModelDownloaderOverWs";
import { useModelDownloaderExtension } from "./useModelDownloaderExtension";

const LOCAL_STORAGE_KEY = "ternion-model-downloader-config";

type LogMessage = {
  type: string;
  label: string;
  data?: unknown;
  timestamp: number;
};

function formatSize(sizeBytes: number): string {
  if (!sizeBytes || sizeBytes === 0) return "N/A";
  const units = ["B", "KB", "MB", "GB"];
  let unitIndex = 0;
  let size = parseFloat(String(sizeBytes));
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

interface ModelRecord {
  product_id?: string;
  name?: string;
  category?: string;
  description?: string;
}

interface StoredConfig {
  baseUrl?: string;
  apiKey?: string;
  caCertPath?: string;
}

function loadConfigFromStorage(): StoredConfig {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as StoredConfig;
    }
  } catch {
    /* ignore */
  }
  return {};
}

function saveConfigToStorage(config: StoredConfig): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
  } catch {
    /* ignore */
  }
}

/** Write base64 content to a file in a FileSystemDirectoryHandle. */
async function writeBase64ToDirectory(
  dirHandle: FileSystemDirectoryHandle,
  filename: string,
  contentBase64: string
): Promise<void> {
  const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  const binary = atob(contentBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  await writable.write(bytes);
  await writable.close();
}

function isBrowserFolderPickerSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "showDirectoryPicker" in window &&
    typeof (window as Window & { showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle> })
      .showDirectoryPicker === "function"
  );
}

export function ModelDownloaderTester() {
  const [wsUrl, setWsUrl] = useState(getModelLoaderWsClientUrl());
  const ws = useModelDownloaderOverWs({ wsUrl });
  const ext = useModelDownloaderExtension();
  const [baseUrl, setBaseUrl] = useState("https://admin.tesaiot.com");
  const [apiKey, setApiKey] = useState("");
  const [caCertPath, setCaCertPath] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100);
  const [productId, setProductId] = useState("");
  const [outputDir, setOutputDir] = useState(() => {
    if (
      typeof window !== "undefined" &&
      window.EXTENSION_PATH
    ) {
      return window.EXTENSION_PATH + "/downloads";
    }
    return "./downloads";
  });
  const [messages, setMessages] = useState<LogMessage[]>([]);
  const browserDirHandleRef = useRef<FileSystemDirectoryHandle | null>(null);

  const addMessage = useCallback(
    (type: string, label: string, data?: unknown) => {
      setMessages((prev) => [
        ...prev,
        { type, label, data, timestamp: Date.now() },
      ]);
    },
    [],
  );

  useEffect(() => {
    const stored = loadConfigFromStorage();
    if (stored.baseUrl) setBaseUrl(stored.baseUrl);
    if (stored.apiKey) setApiKey(stored.apiKey);
    if (stored.caCertPath !== undefined) setCaCertPath(stored.caCertPath ?? "");
  }, []);

  useEffect(() => {
    if (ext.config) {
      setBaseUrl(ext.config.baseUrl);
      setCaCertPath(ext.config.caCertPath ?? "");
    }
  }, [ext.config]);

  useEffect(() => {
    if (ws.error) addMessage("error", ws.error);
  }, [ws.error, addMessage]);

  // When Model Downloader tab is selected (panel mounts), auto-connect to WebSocket
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await ws.connect();
      } catch (e) {
        if (!cancelled) console.error("Model Downloader auto-connect failed:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- run when tab is selected (mount)

  const requestConfig = useCallback(
    () => ({
      baseUrl: baseUrl || "https://admin.tesaiot.com",
      apiKey: apiKey || "",
      caCertPath: caCertPath || undefined,
    }),
    [baseUrl, apiKey, caCertPath],
  );

  const handleLoadFromExtension = useCallback(async () => {
    if (!ext.isAvailable) return;
    try {
      const cfg = await ext.getConfig();
      if (cfg) {
        setBaseUrl(cfg.baseUrl);
        setCaCertPath(cfg.caCertPath ?? "");
        addMessage("system", "Config loaded from extension");
      }
    } catch (e) {
      addMessage("error", (e as Error).message);
    }
  }, [ext, addMessage]);

  const handleSaveToExtension = useCallback(async () => {
    if (!ext.isAvailable) return;
    try {
      await ext.setConfig({
        baseUrl: baseUrl || undefined,
        apiKey: apiKey || undefined,
        caCertPath: caCertPath || undefined,
      });
      addMessage("system", "Config saved to extension");
    } catch (e) {
      addMessage("error", (e as Error).message);
    }
  }, [ext, baseUrl, apiKey, caCertPath, addMessage]);

  const handleSaveToStorage = useCallback(() => {
    saveConfigToStorage({
      baseUrl: baseUrl || undefined,
      apiKey: apiKey || undefined,
      caCertPath: caCertPath || undefined,
    });
    addMessage("system", "Config saved to browser storage");
  }, [baseUrl, apiKey, caCertPath, addMessage]);

  const handleListModels = useCallback(async () => {
    const config = requestConfig();
    if (!config.apiKey) {
      addMessage("error", "API key is required");
      return;
    }
    try {
      const result = await ws.listModels(config, page, limit);
      const total = (result.pagination?.total as number) ?? result.data.length;
      addMessage(
        "success",
        `Listed ${result.data.length} models (page ${page})`,
        { total, pagination: result.pagination },
      );
    } catch (e) {
      addMessage("error", (e as Error).message);
    }
  }, [ws.listModels, requestConfig, page, limit, addMessage]);

  const handleGetInfo = useCallback(async () => {
    if (!productId.trim()) {
      addMessage("error", "Product ID is required");
      return;
    }
    const config = requestConfig();
    if (!config.apiKey) {
      addMessage("error", "API key is required");
      return;
    }
    try {
      const info = await ws.getModelInfo(config, productId.trim());
      addMessage("success", `Model info: ${productId}`, info);
    } catch (e) {
      addMessage("error", (e as Error).message);
    }
  }, [ws.getModelInfo, requestConfig, productId, addMessage]);

  const handlePickFolder = useCallback(async () => {
    if (ext.isAvailable) {
      try {
        const folder = await ext.pickFolder();
        if (folder) {
          setOutputDir(folder);
          browserDirHandleRef.current = null;
          addMessage("system", `Selected folder: ${folder}`);
        }
      } catch (e) {
        addMessage("error", (e as Error).message);
      }
      return;
    }
    if (isBrowserFolderPickerSupported()) {
      try {
        const showDirPicker = (window as unknown as { showDirectoryPicker?: (opts?: { mode?: string }) => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker!;
        const dirHandle = await showDirPicker({ mode: "readwrite" });
        browserDirHandleRef.current = dirHandle;
        setOutputDir(`[Browser] ${dirHandle.name}`);
        addMessage("system", `Selected folder: ${dirHandle.name} (browser)`);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          addMessage("error", (e as Error).message);
        }
      }
    } else {
      addMessage(
        "error",
        "Folder picker requires Chrome/Edge. Type the path for bridge mode.",
      );
    }
  }, [ext, addMessage]);

  const handleDownload = useCallback(async () => {
    const id = productId.trim();
    if (!id) {
      addMessage("error", "Product ID is required");
      return;
    }
    const config = requestConfig();
    if (!config.apiKey) {
      addMessage("error", "API key is required");
      return;
    }
    const dirHandle = browserDirHandleRef.current;
    if (dirHandle) {
      try {
        addMessage("system", `Downloading ${id} to browser folder...`);
        const result = await ws.downloadModelToBrowser(config, id);
        for (const file of result.files) {
          await writeBase64ToDirectory(
            dirHandle,
            file.filename,
            file.contentBase64
          );
        }
        const downloadedFiles = result.files.map((f) => ({
          label: f.label,
          filepath: f.filename,
          size: f.size,
        }));
        addMessage(
          "success",
          `Downloaded ${result.files.length} files to ${dirHandle.name}`,
          {
            productId: result.productId,
            downloadedFiles,
            totalSize: result.totalSize,
            outputDir: dirHandle.name,
          }
        );
      } catch (e) {
        addMessage("error", (e as Error).message);
      }
      return;
    }
    const dir = outputDir.trim() || "./downloads";
    try {
      addMessage("system", `Downloading ${id}...`);
      const result = await ws.downloadModel(config, id, dir);
      addMessage(
        "success",
        `Downloaded ${result.downloadedFiles.length} files to ${result.outputDir}`,
        result
      );
    } catch (e) {
      addMessage("error", (e as Error).message);
    }
  }, [ws.downloadModel, ws.downloadModelToBrowser, requestConfig, productId, outputDir, addMessage]);

  const handleSelectModel = useCallback((id: string) => {
    setProductId(id);
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto w-full p-6 space-y-4 border-2">
      <h1 className="text-2xl font-bold mb-4 shrink-0">Model Downloader (TESAIoT)</h1>
      <p className="text-sm text-gray-400 mb-2">
        Run{" "}
        <code className="bg-gray-700 px-1 rounded">npm run start:bridge</code>{" "}
        to start the broker and Model Downloader bridge. Configure connection in{" "}
        <strong>Settings</strong> tab.
      </p>

      {/* Config Section */}
      <div className="bg-gray-800 rounded-lg p-4 space-y-3">
        <h2 className="text-lg font-semibold">Config</h2>
        <div className="space-y-2">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Base URL</label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://admin.tesaiot.com"
              className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              API Key (pdms_...)
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={ext.config?.hasApiKey ? "••••••••" : "Enter API key"}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              CA Cert Path (optional)
            </label>
            <input
              type="text"
              value={caCertPath}
              onChange={(e) => setCaCertPath(e.target.value)}
              placeholder="Path to custom CA cert"
              className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSaveToStorage}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold"
            >
              Save (browser)
            </button>
            {ext.isAvailable && (
              <>
                <button
                  onClick={handleLoadFromExtension}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded font-semibold"
                >
                  Load from extension
                </button>
                <button
                  onClick={handleSaveToExtension}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded font-semibold"
                >
                  Save to extension
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* List Section */}
      <div className="bg-gray-800 rounded-lg p-4 space-y-3">
        <h2 className="text-lg font-semibold">List Models</h2>
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Page</label>
            <input
              type="number"
              min={1}
              value={page}
              onChange={(e) =>
                setPage(Math.max(1, parseInt(e.target.value, 10) || 1))
              }
              className="w-20 px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Limit</label>
            <input
              type="number"
              min={1}
              max={100}
              value={limit}
              onChange={(e) =>
                setLimit(
                  Math.min(
                    100,
                    Math.max(1, parseInt(e.target.value, 10) || 10),
                  ),
                )
              }
              className="w-20 px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
            />
          </div>
          <button
            onClick={handleListModels}
            disabled={!ws.isConnected || ws.loading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded font-semibold"
          >
            List Models
          </button>
        </div>
        {ws.lastListData && ws.lastListData.length > 0 && (
          <div className="mt-2 max-h-48 overflow-y-auto scrollbar-hide">
            <table className="w-full text-sm">
              <thead>
                <tr className="sticky top-0 z-10 bg-gray-800 text-left text-gray-400">
                  <th className="py-1 pr-2">Product ID</th>
                  <th className="py-1 pr-2">Name</th>
                  <th className="py-1">Category</th>
                </tr>
              </thead>
              <tbody>
                {(ws.lastListData as ModelRecord[]).map((m, i) => (
                  <tr
                    key={m.product_id ?? i}
                    className="border-t border-gray-700 hover:bg-gray-700/50 cursor-pointer"
                    onClick={() =>
                      m.product_id && handleSelectModel(m.product_id)
                    }
                  >
                    <td className="py-1 pr-2 font-mono text-blue-400">
                      {m.product_id ?? "N/A"}
                    </td>
                    <td className="py-1 pr-2">{m.name ?? "N/A"}</td>
                    <td className="py-1">{m.category ?? "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Model Info Section */}
      <div className="bg-gray-800 rounded-lg p-4 space-y-3">
        <h2 className="text-lg font-semibold">Model Info</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            placeholder="Product ID (e.g. PDM-EVM-682847)"
            className="flex-1 px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={handleGetInfo}
            disabled={!ws.isConnected || ws.loading || !productId.trim()}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded font-semibold"
          >
            Get Info
          </button>
        </div>
        {ws.lastModelInfo != null ? (
          <div className="mt-2 p-3 bg-gray-900 rounded text-sm font-mono overflow-x-auto">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(ws.lastModelInfo, null, 2)}
            </pre>
          </div>
        ) : null}
      </div>

      {/* Download Section */}
      <div className="bg-gray-800 rounded-lg p-4 space-y-3">
        <h2 className="text-lg font-semibold">Download</h2>
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              placeholder="Product ID"
              className="flex-1 px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={handlePickFolder}
              disabled={ws.loading}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 text-white rounded font-semibold"
            >
              Choose Folder
            </button>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Output path (e.g. ./downloads or absolute path)
            </label>
            <input
              type="text"
              value={outputDir}
              onChange={(e) => {
                const v = e.target.value;
                setOutputDir(v);
                if (!v.startsWith("[Browser]")) {
                  browserDirHandleRef.current = null;
                }
              }}
              placeholder={isBrowserFolderPickerSupported() && !ext.isAvailable ? "Choose folder or type path for bridge" : "./downloads"}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          {outputDir && (
            <p className="text-sm text-gray-400">Output: {outputDir}</p>
          )}
          {!ext.isAvailable && isBrowserFolderPickerSupported() && (
            <p className="text-xs text-gray-500">
              Browser mode: Choose Folder uses the File System Access API (Chrome, Edge). Requires HTTPS or localhost.
            </p>
          )}
          <button
            onClick={handleDownload}
            disabled={!ws.isConnected || ws.loading || !productId.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded font-semibold"
          >
            Download Model
          </button>
          {ws.downloadProgress != null && (
            <div className="mt-2 p-3 bg-gray-900 rounded text-sm space-y-2">
              <div className="flex justify-between text-gray-300">
                <span>
                  {ws.downloadProgress.phase === "listing" && "Getting model info…"}
                  {ws.downloadProgress.phase === "downloading" &&
                    (ws.downloadProgress.label
                      ? `Downloading: ${ws.downloadProgress.label}`
                      : "Downloading…")}
                  {ws.downloadProgress.phase === "writing" && "Writing files…"}
                  {ws.downloadProgress.phase === "done" && "Done"}
                </span>
                <span className="font-mono">{ws.downloadProgress.percent}%</span>
              </div>
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, ws.downloadProgress.percent)}%` }}
                />
              </div>
              {ws.downloadProgress.totalFiles != null &&
                ws.downloadProgress.fileIndex != null &&
                ws.downloadProgress.phase === "downloading" && (
                  <p className="text-xs text-gray-500">
                    File {ws.downloadProgress.fileIndex} of {ws.downloadProgress.totalFiles}
                  </p>
                )}
            </div>
          )}
        </div>
        {ws.lastDownloadResult && (
          <div className="mt-2 p-3 bg-gray-900 rounded text-sm">
            <p className="font-semibold text-green-400">
              Downloaded {ws.lastDownloadResult.downloadedFiles.length} files (
              {formatSize(ws.lastDownloadResult.totalSize)}) to{" "}
              {ws.lastDownloadResult.outputDir}
            </p>
            <ul className="mt-1 list-disc list-inside text-gray-400">
              {ws.lastDownloadResult.downloadedFiles.map((f, i) => (
                <li key={i}>
                  {f.label}: {f.filepath} ({formatSize(f.size)})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Log Section */}
      <div className="bg-gray-800 rounded-lg p-4 space-y-2">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Log</h2>
          <button
            onClick={() => setMessages([])}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded"
          >
            Clear
          </button>
        </div>
        <div className="bg-gray-900 rounded p-3 max-h-48 overflow-y-auto space-y-2">
          {messages.length === 0 ? (
            <p className="text-gray-500 text-sm">No messages yet</p>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`p-2 rounded text-sm ${
                  msg.type === "error"
                    ? "bg-red-900/30 border-l-2 border-red-500"
                    : msg.type === "success"
                      ? "bg-green-900/30 border-l-2 border-green-500"
                      : "bg-gray-700/30 border-l-2 border-gray-500"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-300">
                      {msg.label}
                    </div>
                    {msg.data !== undefined && (
                      <div className="text-gray-400 mt-1 font-mono text-xs">
                        {typeof msg.data === "object"
                          ? JSON.stringify(msg.data, null, 2)
                          : String(msg.data)}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 ml-2">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
