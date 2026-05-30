import { useEffect, useState } from "react";
import { BITSTREAM2_TOPICS } from "../../../bitstream2/bridge/protocol";
import {
  wireBytesBmi270AccSampleB64,
  wireBytesHelloB64,
} from "../../../bitstream2/dev/wire-frames";
import { useWsClientStore } from "../../ws-client-store";

/** Optional dev inject buttons (Vite dev only). */
export function SimDevToolbar() {
  const publish = useWsClientStore((s) => s.publish);
  const isConnected = useWsClientStore((s) => s.isConnected);
  const subscribeTopic = useWsClientStore((s) => s.subscribeTopic);
  const [last, setLast] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected) return;
    void subscribeTopic(BITSTREAM2_TOPICS.DEV_INJECT_RX, 0, "json");
  }, [isConnected, subscribeTopic]);

  if (!import.meta.env.DEV) {
    return null;
  }

  const inject = (label: string, dataB64: string) => {
    setLast(label);
    void publish(BITSTREAM2_TOPICS.DEV_INJECT_RX, {
      requestId: `sim-ui-${label}-${Date.now()}`,
      dataB64,
    });
  };

  return (
    <div className="rounded-lg border border-amber-800/50 bg-amber-950/25 px-3 py-2">
      <p className="text-xs font-medium text-amber-200/90">Dev inject</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded border border-amber-700/40 px-2 py-1 text-xs hover:bg-amber-900/30"
          onClick={() => inject("hello", wireBytesHelloB64())}
        >
          Inject HELLO
        </button>
        <button
          type="button"
          className="rounded border border-amber-700/40 px-2 py-1 text-xs hover:bg-amber-900/30"
          onClick={() => inject("sample", wireBytesBmi270AccSampleB64())}
        >
          Inject one sample
        </button>
      </div>
      {last ? <p className="mt-1 text-xs text-zinc-500">Last: {last}</p> : null}
    </div>
  );
}
