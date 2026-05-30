import { useCallback, useRef, useState } from "react";
import { BITSTREAM2_TOPICS } from "../../bitstream2/bridge/protocol";
import { BS2_CMD } from "../../bitstream2/domains/config/commands";
import { SERIALPORT_TOPICS } from "../../serialport-bridge/protocol";
import { wireBytesBmi270AccSampleB64, wireBytesHelloB64, wireBytesPingReqB64 } from "../../bitstream2/dev/wire-frames";
import { TRNButton } from "../ui/TRN";
import { ToolConsole } from "./ToolConsole";
import type { Bs2SensorMonitorFeed } from "./useBs2SensorMonitorFeed";
import type { ToolLogLine } from "./tools/monitorToolTypes";
import { useWsClientStore } from "../ws-client-store";

type Props = {
  feed: Bs2SensorMonitorFeed;
};

export function MonitorWsInjectorTool(props: Props) {
  const [busy, setBusy] = useState(false);
  const [logs, setLogs] = useState<ToolLogLine[]>([]);

  const appendLog = useCallback((text: string, tone: ToolLogLine["tone"]) => {
    setLogs((prev) => [
      ...prev.slice(-399),
      { id: `${Date.now()}-${prev.length}`, atMs: Date.now(), text, tone },
    ]);
  }, []);

  const ensureSubs = useCallback(async () => {
    const store = useWsClientStore.getState();
    if (!store.isConnected) {
      await store.connect();
    }
    for (const topic of [
      BITSTREAM2_TOPICS.HELLO,
      BITSTREAM2_TOPICS.EVT_SENSOR,
      BITSTREAM2_TOPICS.RES,
      BITSTREAM2_TOPICS.DEV_STATUS,
    ]) {
      await store.subscribeTopic(topic, 0, "json");
    }
  }, []);

  const injectRx = useCallback(
    async (dataB64: string, label: string) => {
      setBusy(true);
      try {
        await ensureSubs();
        await useWsClientStore.getState().publish(
          BITSTREAM2_TOPICS.DEV_INJECT_RX,
          { requestId: `inject-${Date.now()}`, dataB64 },
          0,
        );
        appendLog(`${label} → bitstream2/dev/inject-rx`, "cmd");
      } catch (e) {
        appendLog(e instanceof Error ? e.message : String(e), "fail");
      } finally {
        setBusy(false);
      }
    },
    [appendLog, ensureSubs],
  );

  const sendPingReq = useCallback(async () => {
    setBusy(true);
    try {
      await ensureSubs();
      await useWsClientStore.getState().publish(
        BITSTREAM2_TOPICS.REQ,
        {
          requestId: `inject-ping-${Date.now()}`,
          reqId: 1,
          cmdId: BS2_CMD.PING,
          timeoutMs: 2000,
        },
        0,
      );
      appendLog("PING → bitstream2/req (mock should answer on res)", "cmd");
    } catch (e) {
      appendLog(e instanceof Error ? e.message : String(e), "fail");
    } finally {
      setBusy(false);
    }
  }, [appendLog, ensureSubs]);

  const pingWrite = useCallback(async () => {
    setBusy(true);
    try {
      await ensureSubs();
      await useWsClientStore.getState().publish(
        SERIALPORT_TOPICS.WRITE,
        { requestId: `inject-write-${Date.now()}`, data: wireBytesPingReqB64() },
        0,
      );
      appendLog("Raw PING frame → serialport/write (UART TX only)", "warn");
    } catch (e) {
      appendLog(e instanceof Error ? e.message : String(e), "fail");
    } finally {
      setBusy(false);
    }
  }, [appendLog, ensureSubs]);

  const loopback = props.feed.loopbackEnabled;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3">
      <div className="shrink-0 rounded-md border border-zinc-800 bg-zinc-900/40 p-3 text-xs text-zinc-400">
        Requires bridge running and{" "}
        <span className="font-mono text-emerald-400/90">bitstream-simulator</span> extension for virtual RX. Simulator is{" "}
        <strong className={loopback ? "text-emerald-400" : "text-amber-400"}>{loopback ? "on" : "off"}</strong>.
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
        <TRNButton
          variant="secondary"
          size="sm"
          disabled={busy || !props.feed.isConnected || !loopback}
          onClick={() => void injectRx(wireBytesHelloB64(), "HELLO wire")}
        >
          Inject HELLO
        </TRNButton>
        <TRNButton
          variant="secondary"
          size="sm"
          disabled={busy || !props.feed.isConnected || !loopback}
          onClick={() => void injectRx(wireBytesBmi270AccSampleB64(), "BMI270 ACC sample")}
        >
          Inject sample
        </TRNButton>
        <TRNButton
          variant="primary"
          size="sm"
          disabled={busy || !props.feed.isConnected || !loopback}
          onClick={() => void sendPingReq()}
        >
          Send PING (REQ)
        </TRNButton>
        <TRNButton
          variant="secondary"
          size="sm"
          disabled={busy || !props.feed.isConnected || !loopback}
          onClick={() => void pingWrite()}
        >
          Raw PING (write)
        </TRNButton>
      </div>

      <ToolConsole
        lines={logs}
        emptyHint="Inject frames or send PING; watch HELLO / EVT_SENSOR / RES in the console…"
      />
    </div>
  );
}
