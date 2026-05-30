import { BsMockFirmware } from "../../../bitstream2/dev/mock-firmware";
import { BsSession } from "../../../bitstream2/runtime/session";
import { BsUartDecoder } from "../../../bitstream2/runtime/uart-decode";
import { BS2_CMD } from "../../../bitstream2/domains/config/commands";

export type MockProbeLogTone = "info" | "cmd" | "pass" | "fail" | "warn";

/**
 * Host-only mock firmware + session (same as run-mock-probe.ts), in-browser.
 */
export async function runMonitorMockProbe(onLog: (text: string, tone: MockProbeLogTone) => void): Promise<boolean> {
  const decoder = new BsUartDecoder();
  const rx: Uint8Array[] = [];
  const mock = new BsMockFirmware((b) => rx.push(b));

  const session = new BsSession({
    write: async (bytes) => {
      mock.rxFromHost(bytes);
      drain();
    },
  });

  const drain = (): void => {
    while (rx.length > 0) {
      const chunk = rx.shift()!;
      for (const ev of decoder.feed(chunk)) {
        if (ev.type === "hello") {
          const tag = (ev.payload as { fwTag?: string }).fwTag ?? "?";
          onLog(`HELLO fwTag=${tag}`, "pass");
        }
        if (ev.type === "sensor") {
          onLog(`SENSOR id=${ev.payload.sensorId} mask=0x${ev.payload.mask.toString(16)}`, "info");
        }
        if (ev.type === "res_frame") {
          session.handleFrame(ev.frame);
        }
      }
    }
  };

  try {
    onLog("BsMockFirmware: emitHello…", "cmd");
    mock.emitHello();
    drain();

    onLog("PING…", "cmd");
    const ping = await session.sendReq({ requestId: "mock-probe", cmdId: BS2_CMD.PING, timeoutMs: 500 });
    onLog(`PING status=${ping.status}`, ping.status === 0 ? "pass" : "fail");

    mock.emitBmi270AccSample();
    drain();

    onLog("Mock probe finished", "pass");
    return ping.status === 0;
  } catch (e) {
    onLog(e instanceof Error ? e.message : String(e), "fail");
    return false;
  }
}
