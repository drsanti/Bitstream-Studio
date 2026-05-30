import { useCallback, useEffect, useMemo, useState } from "react";
import {
  clearStoredAiBridgePairingToken,
  getAiBridgePairingTokenSavedOnly,
  setStoredAiBridgePairingToken,
} from "../../../ai-bridge/ai-bridge-webview-config";
import { TRNButton } from "../../../ui/TRN/TRNButton";
import { useBitstreamConfigStore } from "../../state/bitstreamConfig.store";

type AiBridgeBitstreamMode = "data" | "line" | "both";

type AiBridgeSettings = {
  t3dWsClientUrl: string;
  serialPath: string;
  baudRate: number;
  mode: AiBridgeBitstreamMode;
  autoDetectPort: boolean;
};

const STORAGE_KEY = "ternion.ai.bridge.settings.v1";

function loadSavedSettings(): Partial<AiBridgeSettings> | null {
  try {
    const raw = window.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AiBridgeSettings>;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function persistSettings(next: AiBridgeSettings): void {
  try {
    window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

function parseBaudRate(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.trunc(n);
}

function getVsCodeApi(): { postMessage: (msg: unknown) => void } | null {
  const api = (window as unknown as { __VSCODE_API__?: { postMessage: (msg: unknown) => void } })
    .__VSCODE_API__;
  return api?.postMessage ? api : null;
}

export function AiBridgeSettingsPanel() {
  const bitstreamWsUrl = useBitstreamConfigStore((s) => s.wsUrl);
  const bitstreamSerialPath = useBitstreamConfigStore((s) => s.serialPath);
  const bitstreamBaudRateText = useBitstreamConfigStore((s) => s.baudRateText);

  const defaults = useMemo<AiBridgeSettings>(() => {
    const baud = parseBaudRate(bitstreamBaudRateText) ?? 921600;
    return {
      t3dWsClientUrl: bitstreamWsUrl,
      serialPath: bitstreamSerialPath,
      baudRate: baud,
      mode: "data",
      autoDetectPort: true,
    };
  }, [bitstreamBaudRateText, bitstreamSerialPath, bitstreamWsUrl]);

  const [settings, setSettings] = useState<AiBridgeSettings>(defaults);
  const [dirty, setDirty] = useState(false);
  const [pairingDraft, setPairingDraft] = useState(() =>
    typeof window !== "undefined" ? getAiBridgePairingTokenSavedOnly() : "",
  );

  useEffect(() => {
    const saved = loadSavedSettings();
    if (!saved) {
      setSettings(defaults);
      setDirty(false);
      return;
    }
    setSettings((prev) => ({
      ...prev,
      ...defaults,
      ...saved,
    }));
    setDirty(false);
  }, [defaults]);

  const update = useCallback(<K extends keyof AiBridgeSettings>(k: K, v: AiBridgeSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [k]: v };
      return next;
    });
    setDirty(true);
  }, []);

  const save = useCallback(() => {
    persistSettings(settings);
    setDirty(false);
  }, [settings]);

  const startOrRestart = useCallback(() => {
    save();
    const vscodeApi = getVsCodeApi();
    if (!vscodeApi) {
      return;
    }
    vscodeApi.postMessage({ type: "ai-bridge-stop" });
    vscodeApi.postMessage({
      type: "ai-bridge-start",
      options: {
        t3dWsClientUrl: settings.t3dWsClientUrl,
        bitstream: {
          serialPath: settings.serialPath,
          baudRate: settings.baudRate,
          mode: settings.mode,
          autoDetectPort: settings.autoDetectPort,
        },
      },
    });
  }, [save, settings]);

  const isVsCode = Boolean((window as unknown as { WEBVIEW_READY?: boolean }).WEBVIEW_READY);
  const injectedPairing =
    typeof window !== "undefined"
      ? Boolean(
          (window as unknown as { T3D_AI_BRIDGE_PAIRING_TOKEN?: string }).T3D_AI_BRIDGE_PAIRING_TOKEN?.trim(),
        )
      : false;

  const savePairingToken = useCallback(() => {
    setStoredAiBridgePairingToken(pairingDraft);
  }, [pairingDraft]);

  const clearPairingToken = useCallback(() => {
    clearStoredAiBridgePairingToken();
    setPairingDraft("");
  }, []);

  return (
    <div className="space-y-3 text-zinc-100">
      <div className="text-sm font-semibold">AI Bridge Settings (Dev)</div>
      <div className="text-[11px] text-zinc-400">
        These settings are used when the extension starts the AI bridge process. They are stored in
        your local webview storage.
      </div>

      <div className="rounded border border-zinc-700/70 bg-black/25 p-3">
        <div className="text-[11px] font-medium text-zinc-200">WebSocket pairing token</div>
        <p className="mt-1 text-[10px] leading-snug text-zinc-500">
          When the bridge is started with <span className="font-mono">AI_BRIDGE_PAIRING_TOKEN</span>, clients must send
          the same value in <span className="font-mono">ai/hello</span>. VS Code can inject a token (takes precedence).{" "}
          Otherwise save a token here for browser dev or when injection is off.
        </p>
        {injectedPairing ? (
          <p className="mt-2 text-[10px] text-emerald-400/90">
            Using pairing token injected by the extension — below edits the saved fallback only.
          </p>
        ) : null}
        <input
          type="password"
          autoComplete="off"
          spellCheck={false}
          className="mt-2 w-full rounded border border-zinc-700/80 bg-black/40 px-2 py-1.5 font-mono text-xs text-zinc-100 outline-none placeholder:text-zinc-600"
          placeholder="Paste token to match AI_BRIDGE_PAIRING_TOKEN"
          value={pairingDraft}
          onChange={(e) => setPairingDraft(e.target.value)}
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <TRNButton size="compact" tone="neutral" onClick={savePairingToken}>
            Save pairing token
          </TRNButton>
          <TRNButton size="compact" tone="neutral" className="border-zinc-600/80 bg-zinc-950/60" onClick={clearPairingToken}>
            Clear saved token
          </TRNButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div>
          <div className="text-[11px] text-zinc-400">Serial broker URL (`T3D_WS_CLIENT_URL`)</div>
          <input
            className="mt-1 w-full rounded border border-zinc-700/80 bg-black/40 px-2 py-1 text-xs outline-none"
            value={settings.t3dWsClientUrl}
            onChange={(e) => update("t3dWsClientUrl", e.target.value)}
            placeholder="ws://127.0.0.1:9998"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <div className="text-[11px] text-zinc-400">Serial path (`BITSTREAM_SERIAL_PATH`)</div>
            <input
              className="mt-1 w-full rounded border border-zinc-700/80 bg-black/40 px-2 py-1 text-xs outline-none"
              value={settings.serialPath}
              onChange={(e) => update("serialPath", e.target.value)}
              placeholder="COM3"
            />
          </div>
          <div>
            <div className="text-[11px] text-zinc-400">Baud rate (`BITSTREAM_BAUD_RATE`)</div>
            <input
              className="mt-1 w-full rounded border border-zinc-700/80 bg-black/40 px-2 py-1 text-xs outline-none"
              value={String(settings.baudRate)}
              onChange={(e) => {
                const parsed = parseBaudRate(e.target.value);
                update("baudRate", parsed ?? settings.baudRate);
              }}
              placeholder="921600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <div className="text-[11px] text-zinc-400">Mode (`BITSTREAM_MODE`)</div>
            <select
              className="mt-1 w-full rounded border border-zinc-700/80 bg-black/40 px-2 py-1 text-xs outline-none"
              value={settings.mode}
              onChange={(e) => update("mode", e.target.value as AiBridgeBitstreamMode)}
            >
              <option value="data">data</option>
              <option value="line">line</option>
              <option value="both">both</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-zinc-300">
              <input
                type="checkbox"
                checked={settings.autoDetectPort}
                onChange={(e) => update("autoDetectPort", e.target.checked)}
              />
              Auto-detect port (`BITSTREAM_AUTO_DETECT_PORT`)
            </label>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="text-[11px] text-zinc-500">
          {dirty ? "Unsaved changes" : "Saved"}
        </div>
        <div className="flex items-center gap-2">
          <TRNButton size="compact" tone="neutral" onClick={save}>
            Save
          </TRNButton>
          <TRNButton
            size="compact"
            tone="warning"
            disabled={!isVsCode}
            onClick={startOrRestart}
          >
            Restart AI Bridge
          </TRNButton>
        </div>
      </div>

      {!isVsCode ? (
        <div className="rounded border border-amber-500/30 bg-amber-950/15 p-2 text-[11px] text-amber-100/90">
          Browser mode: cannot start/stop the AI bridge process. Use a terminal or VS Code commands.
        </div>
      ) : null}
    </div>
  );
}

