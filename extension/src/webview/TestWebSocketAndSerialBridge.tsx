import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SerialPortTester } from "./serialport/SerialPortTester";
import { useWsClientStore } from "./ws-client-store";
import { useSerialPortStore } from "./serialport/serial-port-store";
import { ConnectionBlock, PortStatusText, WsStatusText } from "./ui/components/mcu-cli";
import { useSerialPort } from "./serialport/useSerialPort";
import { useLocalNetworkIps } from "./useLocalNetworkIps";

const DEFAULT_SERIAL_TOPICS = [
  "json:serialport/list-response",
  "json:serialport/open-result",
  "json:serialport/close-result",
  "binary:serialport/data",
  "binary:serialport/data-priority",
  "json:serialport/data",
  "json:serialport/status",
] as const satisfies readonly string[];

const McuCliPanel = lazy(() =>
  import("./serialport/McuCliPanel").then((m) => ({
    default: m.McuCliPanel,
  })),
);

const ModelDownloaderTester = lazy(() =>
  import("./model-downloader/ModelDownloaderTester").then((m) => ({
    default: m.ModelDownloaderTester,
  })),
);

type Tab = "ws" | "serial" | "model-downloader" | "settings";

function SettingsPanel() {
  const noop = useCallback(() => {}, []);
  const {
    connectionState,
    status,
    listPorts,
    openPort,
    closePort,
    connect,
    isConnected,
    ports,
    wsUrl,
    selectedPath,
    baudRate,
    setWsUrl,
    setSelectedPath,
    setBaudRate,
  } = useSerialPort("settings", noop);
  const wsBytesReceived = useWsClientStore((s) => s.wsBytesReceived);
  const wsBytesSent = useWsClientStore((s) => s.wsBytesSent);

  const handleListPorts = useCallback(async () => {
    try {
      const list = await listPorts();
      if (list.length > 0 && !selectedPath) setSelectedPath(list[0]!.path);
    } catch (e) {
      console.error("List ports failed:", e);
    }
  }, [listPorts, selectedPath, setSelectedPath]);

  const handleConnect = useCallback(async () => {
    try {
      await connect();
      await handleListPorts();
    } catch (e) {
      console.error("Connect failed:", e);
    }
  }, [connect, handleListPorts]);

  const handleOpenPort = useCallback(
    async (path: string) => {
      setSelectedPath(path);
      try {
        await openPort({
          path,
          baudRate,
          mode: "line",
          readlineDelimiter: "\n",
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("Open failed:", e);
        toast.error(`Open port failed: ${msg}`);
      }
    },
    [openPort, baudRate, setSelectedPath],
  );

  const handleClose = useCallback(async () => {
    try {
      await closePort();
    } catch (e) {
      console.error("Close failed:", e);
    }
  }, [closePort]);

  const handleDisconnect = useCallback(async () => {
    try {
      await useSerialPortStore.getState().disconnect();
      await useWsClientStore.getState().disconnect();
    } catch (e) {
      console.error("Disconnect failed:", e);
    }
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto w-full p-6 space-y-4">
      <h1 className="text-2xl font-bold shrink-0">Settings</h1>
      <ConnectionBlock
        wsUrl={wsUrl}
        onWsUrlChange={setWsUrl}
        connectionState={connectionState}
        status={status}
        ports={ports}
        selectedPath={selectedPath}
        baudRate={String(baudRate)}
        onBaudChange={(v) => setBaudRate(parseInt(v, 10) || 115200)}
        onListPorts={handleListPorts}
        onOpenPort={handleOpenPort}
        onClose={handleClose}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        isConnected={isConnected}
        cardsDefaultOpen={true}
        wsBytesReceived={wsBytesReceived}
        wsBytesSent={wsBytesSent}
      />
    </div>
  );
}

export function TestWebSocketAndSerialBridge() {
  const [tab, setTab] = useState<Tab>("ws");
  const [serialMode, setSerialMode] = useState<"raw" | "cli">("raw");
  const [hasVisitedSerial, setHasVisitedSerial] = useState(false);
  const [hasVisitedModel, setHasVisitedModel] = useState(false);

  // WS tester tab local state
  const [topic, setTopic] = useState("test/topic");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{ type: string; topic?: string; data: unknown; timestamp: number }>>(
    [],
  );
  const [userTopics, setUserTopics] = useState<string[]>([]);
  const [mutedTopics, setMutedTopics] = useState<Set<string>>(
    () =>
      new Set([
        "serialport/list-response",
        "serialport/open-result",
        "serialport/close-result",
        "serialport/data",
        "serialport/data-priority",
        "serialport/status",
      ]),
  );
  const mutedTopicsRef = useRef(mutedTopics);
  mutedTopicsRef.current = mutedTopics;

  const defaultTopicSet = useMemo(() => new Set<string>(DEFAULT_SERIAL_TOPICS), []);
  const allTopics = useMemo(() => {
    const merged: string[] = [...DEFAULT_SERIAL_TOPICS];
    for (const t of userTopics) {
      if (!defaultTopicSet.has(t)) merged.push(t);
    }
    return merged;
  }, [userTopics, defaultTopicSet]);

  // Shared stores
  const wsConnectionState = useWsClientStore((s) => s.connectionState);
  const wsIsConnected = useWsClientStore((s) => s.isConnected);
  const wsUrl = useWsClientStore((s) => s.wsUrl);
  const wsBytesReceived = useWsClientStore((s) => s.wsBytesReceived);
  const wsBytesSent = useWsClientStore((s) => s.wsBytesSent);
  const spStatus = useSerialPortStore((s) => s.status);
  const { primaryIp } = useLocalNetworkIps();

  const wsHeaderHostPort =
    wsConnectionState === "connected" && wsUrl
      ? (() => {
          try {
            const u = new URL(wsUrl);
            const hostname = u.hostname === "localhost" ? (primaryIp ?? "127.0.0.1") : u.hostname;
            const port = u.port ? `:${u.port}` : "";
            return hostname ? `${hostname}${port}` : "";
          } catch {
            return "";
          }
        })()
      : "";

  const addMessage = useCallback((type: string, label: string, data?: unknown) => {
    setMessages((prev) => [...prev, { type, topic: label, data, timestamp: Date.now() }]);
  }, []);

  // Stable ref so the listener always calls current addMessage
  const addMessageRef = useRef(addMessage);
  addMessageRef.current = addMessage;

  // App load: wait 1s, connect WS, list ports, open first port
  useEffect(() => {
    let cancelled = false;

    async function runAppLoadBootstrap() {
      try {
        await new Promise((r) => setTimeout(r, 1000));
        if (cancelled) return;
        await useWsClientStore.getState().connect();
        if (cancelled) return;
        await useSerialPortStore.getState().connect();
        if (cancelled) return;
        const ports = await useSerialPortStore.getState().listPorts();
        if (cancelled || ports.length === 0) return;
        const sp = useSerialPortStore.getState();
        const path =
          sp.selectedPath && ports.some((p) => p.path === sp.selectedPath) ? sp.selectedPath : ports[0]!.path;
        if (!sp.selectedPath) sp.setSelectedPath(path);
        await sp.openPort({
          path,
          baudRate: sp.baudRate,
          mode: "line",
          readlineDelimiter: "\n",
        });
      } catch (e) {
        if (!cancelled) console.error("[app-load] bootstrap failed:", e);
      }
    }

    runAppLoadBootstrap();
    return () => {
      cancelled = true;
      useSerialPortStore.getState().disconnect().catch(console.error);
      useWsClientStore.getState().disconnect().catch(console.error);
    };
  }, []);

  // Register WS tester message listener to show all messages in the log
  useEffect(() => {
    const ws = useWsClientStore.getState();
    ws.addMessageListener("ws-tester", (t, payload, qos) => {
      if (!mutedTopicsRef.current.has(t)) {
        addMessageRef.current("json", `Topic: ${t} (QoS ${qos})`, payload);
      }
    });
    ws.addBinaryListener("ws-tester", (t, data, qos) => {
      if (!mutedTopicsRef.current.has(t)) {
        addMessageRef.current("binary", `Topic: ${t} (QoS ${qos})`, `${data.length} bytes`);
      }
    });
    ws.addSubscribeListener("ws-tester", (t, qos, channel) => {
      const key = `${channel}:${t}`;
      if (!defaultTopicSet.has(key)) {
        setUserTopics((prev) => (prev.includes(key) ? prev : [...prev, key]));
      }
      addMessageRef.current("system", `Subscribed to ${t} (QoS ${qos}, ${channel})`);
    });
    ws.addUnsubscribeListener("ws-tester", (t, channel) => {
      setUserTopics((prev) => prev.filter((s) => !s.includes(t)));
      addMessageRef.current("system", `Unsubscribed from ${t}${channel ? ` (${channel})` : ""}`);
    });

    return () => {
      ws.removeMessageListener("ws-tester");
      ws.removeBinaryListener("ws-tester");
      ws.removeSubscribeListener("ws-tester");
      ws.removeUnsubscribeListener("ws-tester");
    };
  }, [defaultTopicSet]);

  useEffect(() => {
    if (tab === "serial") setHasVisitedSerial(true);
    if (tab === "model-downloader") setHasVisitedModel(true);
  }, [tab]);

  const handleSubscribe = useCallback(async () => {
    if (!wsIsConnected) {
      addMessage("error", "Not connected", "Connect in the Settings tab first.");
      return;
    }
    try {
      await useWsClientStore.getState().subscribeTopic(topic, 0, "json");
    } catch (error) {
      addMessage("error", "Subscribe failed", (error as Error).message);
    }
  }, [wsIsConnected, topic, addMessage]);

  const handlePublish = useCallback(async () => {
    if (!wsIsConnected) {
      addMessage("error", "Not connected", "Please connect first");
      return;
    }
    try {
      let payload: unknown;
      try {
        payload = JSON.parse(message);
      } catch {
        payload = message;
      }
      await useWsClientStore.getState().publish(topic, payload, 0);
      addMessage("sent", `Published to ${topic}`, payload);
    } catch (error) {
      addMessage("error", "Publish failed", (error as Error).message);
    }
  }, [wsIsConnected, topic, message, addMessage]);

  const getStateColor = () => {
    switch (wsConnectionState) {
      case "connected":
        return "bg-green-500";
      case "connecting":
      case "reconnecting":
        return "bg-yellow-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <>
      <ToastContainer position="bottom-right" theme="dark" />
      <div className="h-full w-full max-w-5xl mx-auto flex flex-col overflow-hidden gap-4 p-6">
        <div className="shrink-0 flex flex-col gap-2 mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">TESAIoT Dev.</h1>
            <div className="flex rounded-lg overflow-hidden bg-gray-800 ml-auto">
              <button
                onClick={() => setTab("ws")}
                className={`px-4 py-2 font-semibold ${tab === "ws" ? "bg-blue-600" : "bg-gray-800 hover:bg-gray-700"}`}
              >
                WebSocket
              </button>
              <button
                onClick={() => setTab("serial")}
                className={`px-4 py-2 font-semibold ${tab === "serial" ? "bg-blue-600" : "bg-gray-800 hover:bg-gray-700"}`}
              >
                SerialPort
              </button>
              <button
                onClick={() => setTab("model-downloader")}
                className={`px-4 py-2 font-semibold ${tab === "model-downloader" ? "bg-blue-600" : "bg-gray-800 hover:bg-gray-700"}`}
              >
                Model Downloader
              </button>
              <button
                onClick={() => setTab("settings")}
                className={`px-4 py-2 font-semibold ${tab === "settings" ? "bg-blue-600" : "bg-gray-800 hover:bg-gray-700"}`}
              >
                Settings
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className={`w-2 h-2 rounded-full shrink-0 ${getStateColor()}`} />
            {wsConnectionState === "connected" && wsHeaderHostPort ? (
              <WsStatusText hostPort={wsHeaderHostPort} bytesReceived={wsBytesReceived} bytesSent={wsBytesSent} />
            ) : (
              <span>WS: {wsConnectionState}</span>
            )}
            {spStatus?.isOpen && (
              <>
                <span className="text-gray-500">&middot;</span>
                <PortStatusText
                  path={spStatus.path}
                  baudRate={spStatus.baudRate}
                  bytesRead={spStatus.bytesRead}
                  bytesWritten={spStatus.bytesWritten}
                />
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto scrollbar-hide space-y-4">
          {/* WebSocket tab - always mounted */}
          <div className={tab === "ws" ? "flex flex-1 min-h-0 flex-col overflow-hidden" : "hidden"}>
            <div className="w-full flex-1 min-h-0 overflow-y-auto p-6 space-y-4 border-2">
              <h1 className="text-2xl font-bold mb-4">WebSocket (MQTT-style)</h1>

              {/* Subscription Section */}
              <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                <h2 className="text-lg font-semibold">Subscribe</h2>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Topic (e.g., sensor/temperature)"
                    className="flex-1 px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                    disabled={!wsIsConnected}
                  />
                  <button
                    onClick={handleSubscribe}
                    disabled={!wsIsConnected}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded font-semibold"
                  >
                    Subscribe
                  </button>
                </div>
                {allTopics.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-400 mb-1">
                      Subscribed Topics <span className="text-gray-500">(click to toggle)</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {allTopics.map((t, i) => {
                        const rawTopic = t.includes(":") ? t.split(":").slice(1).join(":") : t;
                        const isMuted = mutedTopics.has(rawTopic);
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setMutedTopics((prev) => {
                                const next = new Set(prev);
                                if (next.has(rawTopic)) {
                                  next.delete(rawTopic);
                                } else {
                                  next.add(rawTopic);
                                }
                                return next;
                              });
                            }}
                            className={`px-2 py-1 text-sm rounded transition-colors ${
                              isMuted ? "bg-gray-700/40 text-gray-500 line-through" : "bg-green-700/60 text-green-200"
                            }`}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Publish Section */}
              <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                <h2 className="text-lg font-semibold">Publish</h2>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Topic"
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                    disabled={!wsIsConnected}
                  />
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder='Message (JSON or plain text, e.g., {"value": 25.5})'
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
                    rows={3}
                    disabled={!wsIsConnected}
                  />
                  <button
                    onClick={handlePublish}
                    disabled={!wsIsConnected}
                    className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded font-semibold"
                  >
                    Publish
                  </button>
                </div>
              </div>

              {/* Messages Section */}
              <div className="bg-gray-800 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Messages</h2>
                  <button
                    onClick={() => setMessages([])}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded"
                  >
                    Clear
                  </button>
                </div>
                <div className="bg-gray-900 rounded p-3 max-h-96 overflow-y-auto space-y-2">
                  {messages.length === 0 ? (
                    <p className="text-gray-500 text-sm">No messages yet</p>
                  ) : (
                    messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`p-2 rounded text-sm ${
                          msg.type === "error"
                            ? "bg-red-900/30 border-l-2 border-red-500"
                            : msg.type === "sent"
                              ? "bg-blue-900/30 border-l-2 border-blue-500"
                              : msg.type === "json"
                                ? "bg-green-900/30 border-l-2 border-green-500"
                                : msg.type === "binary"
                                  ? "bg-purple-900/30 border-l-2 border-purple-500"
                                  : "bg-gray-700/30 border-l-2 border-gray-500"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-300">{msg.topic}</div>
                            {msg.data !== undefined && (
                              <div className="text-gray-400 mt-1 font-mono text-xs">
                                {typeof msg.data === "object" ? JSON.stringify(msg.data, null, 2) : String(msg.data)}
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
          </div>

          {/* Settings tab - WebSocket & Port connection */}
          {tab === "settings" && (
            <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
              <SettingsPanel />
            </div>
          )}

          {/* Serial tab - Raw (SerialPortTester) or CLI (McuCliPanel); mount active panel only */}
          {hasVisitedSerial && tab === "serial" && (
            <div className="flex flex-1 min-h-0 flex-col gap-4">
              <div className="flex rounded-lg overflow-hidden bg-gray-800 w-fit shrink-0">
                <button
                  type="button"
                  onClick={() => setSerialMode("raw")}
                  className={`px-4 py-2 font-semibold ${
                    serialMode === "raw" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"
                  }`}
                >
                  Raw
                </button>
                <button
                  type="button"
                  onClick={() => setSerialMode("cli")}
                  className={`px-4 py-2 font-semibold ${
                    serialMode === "cli" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"
                  }`}
                >
                  MCU CLI
                </button>
              </div>
              {serialMode === "raw" ? (
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  <SerialPortTester />
                </div>
              ) : (
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  <Suspense fallback={<div className="p-6 text-gray-400">Loading MCU CLI...</div>}>
                    <McuCliPanel />
                  </Suspense>
                </div>
              )}
            </div>
          )}

          {/* Model Downloader tab - lazy loaded, keep mounted once visited */}
          {hasVisitedModel && (
            <div className={tab === "model-downloader" ? "flex flex-1 min-h-0 flex-col overflow-hidden" : "hidden"}>
              <Suspense fallback={<div className="p-6 text-gray-400">Loading Model Downloader...</div>}>
                <ModelDownloaderTester />
              </Suspense>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
