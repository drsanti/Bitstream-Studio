import { useEffect, useState } from "react";
import {
  BITSTREAM2_TOPICS,
  type Bitstream2DevStatusPayload,
} from "../../bitstream2/bridge/protocol";
import {
  wireBytesBmi270AccSampleB64,
  wireBytesHelloB64,
  wireBytesPingReqB64,
} from "../../bitstream2/dev/wire-frames";
import { SERIALPORT_TOPICS } from "../../serialport-bridge/protocol";
import { useWsClientStore } from "../ws-client-store";

/**
 * Dev-only controls: inject BS traffic via `serialport/write` and `bitstream2/dev/inject-rx`.
 * External bitstream-simulator listens on the same broker topic.
 */
export function Bitstream2DevPanel() {
  const isConnected = useWsClientStore((s) => s.isConnected);
  const publish = useWsClientStore((s) => s.publish);
  const subscribeTopic = useWsClientStore((s) => s.subscribeTopic);
  const addMessageListener = useWsClientStore((s) => s.addMessageListener);
  const removeMessageListener = useWsClientStore((s) => s.removeMessageListener);

  const [devStatus, setDevStatus] = useState<Bitstream2DevStatusPayload | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected) return;
    void subscribeTopic(BITSTREAM2_TOPICS.DEV_STATUS, 0, "json");
    const id = "bitstream2-dev-panel";
    addMessageListener(id, (topic, payload) => {
      if (topic === BITSTREAM2_TOPICS.DEV_STATUS) {
        setDevStatus(payload as Bitstream2DevStatusPayload);
      }
    });
    return () => removeMessageListener(id);
  }, [addMessageListener, isConnected, removeMessageListener, subscribeTopic]);

  if (!import.meta.env.DEV) {
    return null;
  }

  const injectRx = (label: string, dataB64: string) => {
    setLastAction(label);
    void publish(BITSTREAM2_TOPICS.DEV_INJECT_RX, {
      requestId: `ui-${label}-${Date.now()}`,
      dataB64,
    });
  };

  const writeUart = (label: string, dataB64: string) => {
    setLastAction(label);
    void publish(SERIALPORT_TOPICS.WRITE, {
      requestId: `ui-write-${Date.now()}`,
      data: dataB64,
    });
  };

  return (
    <div className="mt-3 rounded-md border border-amber-700/60 bg-amber-950/20 p-3">
      <div className="text-sm font-medium text-amber-200">Dev simulator (WS)</div>
      <div className="mt-1 text-xs text-amber-100/80">
        Simulator: {devStatus?.loopbackEnabled ? "online" : "offline — start bitstream-simulator extension + bridge"}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded border border-amber-700/50 px-2 py-1 text-xs hover:bg-amber-900/40"
          onClick={() => injectRx("inject-hello", wireBytesHelloB64())}
        >
          Inject HELLO (RX)
        </button>
        <button
          type="button"
          className="rounded border border-amber-700/50 px-2 py-1 text-xs hover:bg-amber-900/40"
          onClick={() => injectRx("inject-sample", wireBytesBmi270AccSampleB64())}
        >
          Inject sample (RX)
        </button>
        <button
          type="button"
          className="rounded border border-amber-700/50 px-2 py-1 text-xs hover:bg-amber-900/40"
          onClick={() => writeUart("write-ping-req", wireBytesPingReqB64())}
        >
          Write PING REQ (TX → mock)
        </button>
      </div>
      {lastAction ? (
        <div className="mt-2 text-xs text-zinc-400">Last: {lastAction}</div>
      ) : null}
    </div>
  );
}
