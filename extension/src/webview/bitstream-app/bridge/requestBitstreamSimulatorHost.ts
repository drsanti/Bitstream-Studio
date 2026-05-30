import { getVsCodeApi } from "../../extension-bridge/getVsCodeApi";
import { isVsCodeExtensionWebview } from "../../isVsCodeExtensionWebview";
import { appendTelemetryActivity } from "../../sensor-telemetry/store/telemetryActivity.store";
import { useBitstreamTelemetrySourceStore } from "../state/bitstreamTelemetrySource.store";

let nextRequestId = 1;

type HostAction = "bitstream-simulator-start" | "bitstream-simulator-stop";

type HostResult = {
  ok: boolean;
  error?: string;
};

function postHostRequest(
  type: HostAction,
  responseType: string,
  payload?: { ensureBackends?: boolean },
): Promise<HostResult>
{
  const api = getVsCodeApi();
  if (!api)
  {
    return Promise.resolve({ ok: false, error: "VS Code API not available." });
  }

  const requestId = `bss-${nextRequestId++}`;

  return new Promise((resolve) =>
  {
    const timeoutMs = 15000;
    const timeout = window.setTimeout(() =>
    {
      window.removeEventListener("message", onMessage);
      resolve({ ok: false, error: "Extension host did not respond (timeout)." });
    }, timeoutMs);

    const onMessage = (event: MessageEvent): void =>
    {
      const data = event.data as {
        type?: string;
        requestId?: string;
        ok?: boolean;
        error?: string;
      };
      if (data?.type !== responseType || data.requestId !== requestId)
      {
        return;
      }
      window.clearTimeout(timeout);
      window.removeEventListener("message", onMessage);
      resolve({ ok: data.ok === true, error: data.error });
    };

    window.addEventListener("message", onMessage);
    api.postMessage({ type, requestId, ...payload });
  });
}

/** Ask the extension host to run bitstreamSimulator.start (VS Code webview only). */
export async function requestStartBitstreamSimulator(): Promise<HostResult>
{
  if (!isVsCodeExtensionWebview())
  {
    return {
      ok: false,
      error: "Start the bitstream-simulator extension manually (browser dev mode).",
    };
  }
  return postHostRequest("bitstream-simulator-start", "bitstream-simulator-start-response", {
    ensureBackends: true,
  });
}

/** Ask the extension host to run bitstreamSimulator.stop (VS Code webview only). */
export async function requestStopBitstreamSimulator(): Promise<HostResult>
{
  if (!isVsCodeExtensionWebview())
  {
    return { ok: false, error: "Stop simulator from the bitstream-simulator sidebar." };
  }
  return postHostRequest("bitstream-simulator-stop", "bitstream-simulator-stop-response");
}

/**
 * When Source is Simulator and the external VSIX is offline, start it via the host.
 * Returns false when start was required but failed (caller should skip Connect).
 */
export async function ensureBitstreamSimulatorReady(): Promise<boolean>
{
  const tel = useBitstreamTelemetrySourceStore.getState();
  if (tel.backend !== "simulator" || tel.loopbackAvailable)
  {
    return true;
  }
  if (!isVsCodeExtensionWebview())
  {
    return true;
  }

  appendTelemetryActivity({
    text: "Starting Bitstream Simulator extension…",
    tone: "info",
  });

  const result = await requestStartBitstreamSimulator();
  if (!result.ok)
  {
    appendTelemetryActivity({
      text: result.error ?? "Could not start Bitstream Simulator.",
      tone: "error",
    });
    return false;
  }

  appendTelemetryActivity({
    text: "Bitstream Simulator started — connecting…",
    tone: "ok",
  });
  return true;
}
