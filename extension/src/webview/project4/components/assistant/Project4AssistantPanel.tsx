import { Eraser, Joystick, Loader2, MessageSquareText, Play, Send, Sparkles } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { T3DVSCodeUtils } from "@ternion/t3d/vscode-webview";
import { useShallow } from "zustand/react/shallow";
import { getStoredAnthropicApiKey } from "../../../ai-bridge/ai-bridge-webview-config";
import { useAiBridgeClient } from "../../../ai-bridge/useAiBridgeClient";
import { TRNHighlightedJsonBlock, TRNHintText } from "../../../ui/TRN";
import { TRNButton } from "../../../ui/TRN/TRNButton";
import { TRNMarkdownRenderer } from "../../../ui/TRN/TRNMarkdownRenderer.js";
import { TRNToggleSwitch } from "../../../ui/TRN/TRNToggleSwitch";
import { isVsCodeExtensionWebview } from "../../../isVsCodeExtensionWebview";
import {
  DEFAULT_PROJECT4_ASSISTANT_PROMPT,
  DEFAULT_PROJECT4_ASSISTANT_PROMPT_TH,
  readProject4QuickPromptLocale,
} from "../../lib/project4-assistant-quick-prompts";
import { project4SettingsToMcuHttpPayload } from "../../lib/project4-settings-to-mcu-http-payload";
import { Project4AssistantQuickPromptPicker } from "./Project4AssistantQuickPromptPicker";
import { useProject4SettingsStore } from "../../settings/project4-settings.store";
import { twMerge } from "tailwind-merge";

const ENABLE_MCP_TOOLS_STORAGE_KEY = "ternion.project4.enableMcpTools";
const AUTO_CONFIRM_RISKY_TOOLS_STORAGE_KEY = "ternion.project4.autoConfirmRiskyMcpTools";

/** `"1"` on, `"0"` off; missing key defaults **on** (Project 4 Assistant UX default). */
function readStoredBoolPrefOnByDefault(key: string): boolean {
  if (typeof window === "undefined") {
    return true;
  }
  try {
    const v = window.localStorage.getItem(key);
    if (v === "0") {
      return false;
    }
    if (v === "1") {
      return true;
    }
    return true;
  } catch {
    return true;
  }
}

function confirmAckKey(requestId: string, confirmToken: string): string {
  return `${requestId}:${confirmToken}`;
}

const AI_INTERACTION_HINT =
  "When on, the assistant can call tools to read live sensor data and send drive or speed commands using Project 4 settings → Connection. Point that URL at your robot on the network or at the mock MCU for twin development — it is the same endpoint the 3D view polls.";

const AI_DRIVE_HINT =
  "When on, the assistant can run motion and speed tools without the orange confirmation step. Preference is saved on this machine.";

function AssistantToggleRow(props: {
  label: string;
  hint?: string;
  prefixIcon?: ReactNode;
  /** Accent when checked (Lucide stroke uses currentColor); zinc gray when off or row disabled. */
  accent?: "sky" | "emerald";
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  const { label, hint, prefixIcon, accent = "sky", checked, onCheckedChange, disabled } = props;
  const [hintOpen, setHintOpen] = useState(false);

  const iconActive = checked && !disabled;
  const iconToneClass = iconActive
    ? accent === "emerald"
      ? "text-emerald-400/90 motion-safe:animate-pulse"
      : "text-sky-400/90 motion-safe:animate-pulse"
    : "text-zinc-500";

  return (
    <div
      className="relative rounded-lg"
      onMouseEnter={() => {
        if (hint != null && hint.length > 0) {
          setHintOpen(true);
        }
      }}
      onMouseLeave={() => setHintOpen(false)}
    >
      <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800/85 bg-zinc-950/55 px-2.5 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {prefixIcon != null ? (
            <span
              className={twMerge(
                "inline-flex shrink-0 items-center gap-0.5 transition-colors duration-300",
                iconToneClass,
              )}
              aria-hidden
            >
              {prefixIcon}
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-medium text-zinc-200">{label}</div>
          </div>
        </div>
        <TRNToggleSwitch
          checked={checked}
          disabled={disabled}
          ariaLabel={label}
          onCheckedChange={onCheckedChange}
        />
      </div>
      {hintOpen && hint != null && hint.length > 0 ? (
        <div
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-0 z-200 mb-1 w-max max-w-[min(280px,calc(100vw-48px))] rounded-md border border-zinc-700/80 bg-zinc-900/95 px-2 py-1.5 shadow-lg"
        >
          <TRNHintText tone="muted" className="text-[10px] leading-snug text-zinc-100">
            {hint}
          </TRNHintText>
        </div>
      ) : null}
    </div>
  );
}

/** Friendly label for risky tool confirmations (avoid raw ids in the title line). */
function friendlyToolAction(toolId: string): string {
  if (toolId.includes("telemetry") || toolId.includes("_get")) {
    return "Read sensors";
  }
  if (toolId.includes("move")) {
    return "Drive the robot";
  }
  if (toolId.includes("speed") || toolId.includes("set_speed")) {
    return "Change speed preset";
  }
  return "Requested action";
}

export function Project4AssistantPanel() {
  const {
    wsUrl,
    connected,
    send,
    traceRows,
    bridgeErrors,
    activeRequestId,
    liveAnswer,
    finalAnswer,
    submitPrompt,
    clearTraceTimeline,
    clearBridgeErrors,
    clearOutboundLog,
  } = useAiBridgeClient();

  const canStartBridgeFromUi = isVsCodeExtensionWebview();
  const requestStartAiBridge = useCallback(() => {
    const vscodeApi =
      (typeof window !== "undefined" &&
      (window as unknown as { __VSCODE_API__?: { postMessage: (msg: unknown) => void } }).__VSCODE_API__)
        ? (window as unknown as { __VSCODE_API__: { postMessage: (msg: unknown) => void } }).__VSCODE_API__
        : T3DVSCodeUtils.getVsCodeApi();
    vscodeApi?.postMessage({ type: "ai-bridge-start" });
  }, []);

  const httpSlice = useProject4SettingsStore(
    useShallow((s) => ({
      mcuBaseUrl: s.mcuBaseUrl,
      telemetryPath: s.telemetryPath,
      movePath: s.movePath,
      setSpeedPath: s.setSpeedPath,
      moveDirQueryKey: s.moveDirQueryKey,
      setSpeedValueQueryKey: s.setSpeedValueQueryKey,
      httpRequestTimeoutMs: s.httpRequestTimeoutMs,
      setSpeedUseQuery: s.setSpeedUseQuery,
    })),
  );
  const mcuBaseUrl = httpSlice.mcuBaseUrl;

  const [prompt, setPrompt] = useState(() =>
    typeof window !== "undefined" && readProject4QuickPromptLocale() === "th"
      ? DEFAULT_PROJECT4_ASSISTANT_PROMPT_TH
      : DEFAULT_PROJECT4_ASSISTANT_PROMPT,
  );
  const [enableMcpTools, setEnableMcpTools] = useState(() =>
    readStoredBoolPrefOnByDefault(ENABLE_MCP_TOOLS_STORAGE_KEY),
  );
  const [autoConfirmRiskyTools, setAutoConfirmRiskyTools] = useState(() =>
    readStoredBoolPrefOnByDefault(AUTO_CONFIRM_RISKY_TOOLS_STORAGE_KEY),
  );
  /** Timeline keeps `ai/tool_confirm_required` forever; hide prompts once we've ACKed (manual or auto). */
  const [ackedConfirmKeys, setAckedConfirmKeys] = useState<Record<string, true>>({});
  const sentConfirmGuardRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    try {
      window.localStorage?.setItem(ENABLE_MCP_TOOLS_STORAGE_KEY, enableMcpTools ? "1" : "0");
    } catch {
      // ignore
    }
  }, [enableMcpTools]);

  useEffect(() => {
    try {
      window.localStorage?.setItem(
        AUTO_CONFIRM_RISKY_TOOLS_STORAGE_KEY,
        autoConfirmRiskyTools ? "1" : "0",
      );
    } catch {
      // ignore
    }
  }, [autoConfirmRiskyTools]);

  useEffect(() => {
    setAckedConfirmKeys({});
    sentConfirmGuardRef.current.clear();
  }, [activeRequestId]);

  const mcuConfigured = mcuBaseUrl.trim().length > 0;

  const project4PayloadForRequest = useMemo(() => {
    if (!enableMcpTools || !mcuConfigured) {
      return undefined;
    }
    return project4SettingsToMcuHttpPayload(httpSlice);
  }, [enableMcpTools, httpSlice, mcuConfigured]);

  const pendingConfirms = useMemo(() => {
    const out: Array<{ requestId: string; confirmToken: string; toolId: string; warning: string }> = [];
    for (const row of traceRows) {
      if (row.event.kind === "ai/tool_confirm_required") {
        const key = confirmAckKey(row.requestId, row.event.confirmToken);
        if (ackedConfirmKeys[key]) {
          continue;
        }
        out.push({
          requestId: row.requestId,
          confirmToken: row.event.confirmToken,
          toolId: row.event.toolId,
          warning: row.event.userFacingWarning,
        });
      }
    }
    return out;
  }, [traceRows, ackedConfirmKeys]);

  const fireToolConfirm = useCallback(
    (requestId: string, confirmToken: string) => {
      const ak = getStoredAnthropicApiKey().trim();
      send({
        type: "ai/tool_confirm",
        requestId,
        confirmToken,
        ...(ak.length > 0 ? { anthropicApiKey: ak } : {}),
      });
    },
    [send],
  );

  useEffect(() => {
    if (!autoConfirmRiskyTools || !connected || !enableMcpTools) {
      return;
    }
    const additions: Record<string, true> = {};
    for (const row of traceRows) {
      if (row.event.kind !== "ai/tool_confirm_required") {
        continue;
      }
      const key = confirmAckKey(row.requestId, row.event.confirmToken);
      if (ackedConfirmKeys[key] || sentConfirmGuardRef.current.has(key)) {
        continue;
      }
      sentConfirmGuardRef.current.add(key);
      additions[key] = true;
      fireToolConfirm(row.requestId, row.event.confirmToken);
    }
    if (Object.keys(additions).length > 0) {
      setAckedConfirmKeys((prev) => ({ ...prev, ...additions }));
    }
  }, [
    ackedConfirmKeys,
    autoConfirmRiskyTools,
    connected,
    enableMcpTools,
    fireToolConfirm,
    traceRows,
  ]);

  const onSend = useCallback(() => {
    const outgoing = prompt;
    if (outgoing.trim().length === 0) {
      return;
    }
    clearTraceTimeline();
    clearBridgeErrors();
    clearOutboundLog();
    submitPrompt(outgoing, {
      devTrace: false,
      includeThinkingSummary: false,
      enableMcpTools,
      ...(enableMcpTools ? { project4McpOnly: true } : {}),
      ...(project4PayloadForRequest != null ? { project4McuHttp: project4PayloadForRequest } : {}),
    });
    setPrompt("");
  }, [
    clearBridgeErrors,
    clearOutboundLog,
    clearTraceTimeline,
    enableMcpTools,
    project4PayloadForRequest,
    prompt,
    submitPrompt,
  ]);

  const canSend = connected && prompt.trim().length > 0;

  const replyMarkdown = useMemo(() => {
    const merged = (finalAnswer ?? liveAnswer ?? "").trim();
    return merged.length > 0 ? merged : null;
  }, [finalAnswer, liveAnswer]);

  const isStreamingOrWaiting =
    connected && activeRequestId != null && replyMarkdown == null;

  const onComposerKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key !== "Enter" || e.shiftKey) {
        return;
      }
      e.preventDefault();
      if (canSend) {
        onSend();
      }
    },
    [canSend, onSend],
  );

  return (
    <div className="flex h-full min-h-[min(420px,55vh)] flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <MessageSquareText className="h-4 w-4 shrink-0 text-cyan-400/90" aria-hidden />
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span
              className="shrink-0 text-[11px] font-semibold text-zinc-200"
              title={connected ? `Connected · ${wsUrl}` : `Not connected · ${wsUrl}`}
            >
              {connected ? "Ready" : "Not connected"}
            </span>
            <span className="min-w-0 truncate text-[10px] text-zinc-600 tabular-nums" title={wsUrl}>
              {wsUrl}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={twMerge(
              "h-2 w-2 shrink-0 rounded-full",
              connected ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.45)]" : "bg-rose-500",
            )}
            title={connected ? "Connected" : "Not connected"}
            aria-hidden
          />
          <span className="text-[11px] tabular-nums text-zinc-400">{connected ? "Live" : "Offline"}</span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col border-b border-white/5 bg-zinc-950/40">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 py-3">
          <div
            className={twMerge(
              "flex min-h-0 w-full max-w-none flex-1 flex-col overflow-hidden rounded-lg border shadow-inner",
              connected ? "border-zinc-700/70 bg-black/45" : "border-zinc-800/60 bg-black/25",
            )}
          >
            {!connected ? (
              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 scrollbar-dark-micro">
                {canStartBridgeFromUi ? (
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-800/70 bg-black/25 px-2.5 py-2">
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold text-zinc-200">AI bridge is not running</div>
                      <div className="mt-0.5 text-[10px] leading-snug text-zinc-500">
                        Click to start the local AI service, then send your message.
                      </div>
                    </div>
                    <TRNButton
                      type="button"
                      className="gap-1.5 border-cyan-800/50 bg-cyan-950/35 px-2.5 hover:bg-cyan-900/35"
                      onClick={requestStartAiBridge}
                      title="Start AI Bridge (local WebSocket service)"
                    >
                      <Play className="h-3.5 w-3.5 text-cyan-200/90" strokeWidth={2.25} aria-hidden />
                      <span className="text-[11px] font-semibold text-cyan-100/95">Start AI Bridge</span>
                    </TRNButton>
                  </div>
                ) : null}
                <TRNMarkdownRenderer
                  markdown="_Start the assistant service from the extension, then write your question below._"
                  tone="neutral"
                  enableZoom={true}
                  enableCodeCopy={true}
                  enableSyntaxHighlight={true}
                />
              </div>
            ) : replyMarkdown != null ? (
              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 scrollbar-dark-micro">
                <TRNMarkdownRenderer
                  markdown={finalAnswer ?? liveAnswer ?? ""}
                  tone="neutral"
                  enableZoom={true}
                  enableCodeCopy={true}
                  enableSyntaxHighlight={true}
                />
              </div>
            ) : isStreamingOrWaiting ? (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-hidden px-2 py-6 text-center">
                <Loader2 className="h-7 w-7 shrink-0 animate-spin text-cyan-400/85" aria-hidden />
                <p className="text-[11px] text-zinc-400">Working on your answer…</p>
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden px-1 py-6">
                <p className="text-center text-[11px] text-zinc-500">
                  Your reply will show here. Try asking about distances, wheel speeds, or how to stop safely.
                </p>
                <p className="mt-3 text-center text-[10px] leading-snug text-zinc-600">
                  Enter sends · Shift+Enter new line · Assistant sign-in is under Project 4 settings.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {pendingConfirms.length > 0 ? (
        <div className="max-h-36 shrink-0 overflow-y-auto border-b border-amber-500/20 bg-amber-950/20 px-3 py-2 scrollbar-dark-micro">
          <div className="text-[11px] font-semibold text-amber-100">Needs your OK</div>
          <div className="mt-2 flex flex-col gap-2">
            {pendingConfirms.map((c) => (
              <div
                key={`${c.requestId}:${c.confirmToken}`}
                className="flex items-start justify-between gap-2 rounded-lg border border-amber-500/30 bg-black/25 p-2"
              >
                <div className="min-w-0 text-[11px] text-amber-50/95">
                  <span className="font-medium text-amber-50">{friendlyToolAction(c.toolId)}</span>
                  <div className="mt-1 text-amber-100/85">{c.warning}</div>
                </div>
                <TRNButton
                  size="compact"
                  className="shrink-0 border-amber-600/60 bg-amber-950/40 hover:bg-amber-900/35"
                  onClick={() => {
                    const key = confirmAckKey(c.requestId, c.confirmToken);
                    sentConfirmGuardRef.current.add(key);
                    setAckedConfirmKeys((prev) => ({ ...prev, [key]: true }));
                    fireToolConfirm(c.requestId, c.confirmToken);
                  }}
                >
                  Allow
                </TRNButton>
              </div>
            ))}
          </div>
          {!autoConfirmRiskyTools ? (
            <p className="mt-2 text-[10px] leading-snug text-amber-200/75">
              Tip: hover <span className="font-medium text-amber-100/95">AI Drive</span> in the footer for details, or turn it on to skip this prompt next time.
            </p>
          ) : null}
        </div>
      ) : null}

      {bridgeErrors.length > 0 ? (
        <div className="max-h-28 shrink-0 overflow-y-auto border-b border-rose-500/25 bg-rose-950/15 px-3 py-2 scrollbar-dark-micro">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-rose-100/95">
              Something went wrong ({bridgeErrors.length})
            </span>
            <TRNButton
              type="button"
              size="compact"
              className="border-rose-600/50 bg-rose-950/35 hover:bg-rose-900/30"
              onClick={() => clearBridgeErrors()}
            >
              Dismiss
            </TRNButton>
          </div>
          <div className="mt-2 flex flex-col gap-2">
            {bridgeErrors.map((err, idx) => (
              <TRNHighlightedJsonBlock
                key={`${err.atMs}-${idx}-${err.requestId ?? "none"}`}
                value={JSON.stringify(
                  { requestId: err.requestId, message: err.error, time: err.atMs },
                  null,
                  2,
                )}
                className="border-rose-500/20 bg-black/35"
              />
            ))}
          </div>
        </div>
      ) : null}

      <footer className="shrink-0 space-y-2 border-t border-white/10 bg-zinc-950 px-3 pb-3 pt-2">
        <AssistantToggleRow
          label="AI Interaction"
          hint={AI_INTERACTION_HINT}
          accent="sky"
          prefixIcon={<Sparkles className="h-3.5 w-3.5" strokeWidth={2.25} />}
          checked={enableMcpTools}
          onCheckedChange={setEnableMcpTools}
        />

        <AssistantToggleRow
          label="AI Drive"
          hint={AI_DRIVE_HINT}
          accent="emerald"
          prefixIcon={<Joystick className="h-3.5 w-3.5" strokeWidth={2.25} />}
          checked={autoConfirmRiskyTools}
          onCheckedChange={setAutoConfirmRiskyTools}
          disabled={!enableMcpTools}
        />

        {!mcuConfigured && enableMcpTools ? (
          <p className="rounded-md border border-amber-500/30 bg-amber-950/25 px-2 py-1.5 text-[10px] leading-snug text-amber-100/90">
            Set the MCU base URL in <span className="font-medium text-amber-50/95">Project 4 settings → Connection</span>{" "}
            first. Until then you still get text-only answers.
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Project4AssistantQuickPromptPicker onPick={setPrompt} />
          <TRNButton
            type="button"
            className="gap-1.5 border-zinc-600/80 bg-zinc-950/60 px-2.5 hover:bg-zinc-900/75"
            disabled={prompt.length === 0}
            title={prompt.length === 0 ? "Nothing to clear" : "Clear the message box"}
            aria-label="Clear message"
            onClick={() => setPrompt("")}
          >
            <Eraser className="h-3.5 w-3.5 shrink-0 text-zinc-300/90" strokeWidth={2.25} aria-hidden />
            <span className="text-[11px] font-semibold text-zinc-200">Clear</span>
          </TRNButton>
        </div>

        <div className="flex gap-2">
          <textarea
            className="min-h-[88px] flex-1 resize-y rounded-xl border border-zinc-700/80 bg-black/40 px-3 py-2 font-sans text-xs leading-relaxed text-zinc-100 outline-none ring-cyan-500/0 transition-shadow placeholder:text-zinc-600 focus-visible:border-cyan-600/50 focus-visible:ring-2 focus-visible:ring-cyan-500/25"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={onComposerKeyDown}
            placeholder="Write your question… Enter to send · Shift+Enter new line"
            aria-label="Your message"
          />
          <TRNButton
            size="compact"
            className="h-[88px] min-w-11 shrink-0 flex-col gap-0.5 border-cyan-800/50 bg-cyan-950/35 px-2 hover:bg-cyan-900/35"
            disabled={!canSend}
            title={
              !connected
                ? "Connect first"
                : !prompt.trim()
                  ? "Write something to send"
                  : "Send"
            }
            onClick={() => {
              if (canSend) {
                onSend();
              }
            }}
          >
            <Send className="h-4 w-4 text-cyan-200/95" strokeWidth={2} aria-hidden />
            <span className="text-[10px] font-semibold text-cyan-100/95">Send</span>
          </TRNButton>
        </div>
      </footer>
    </div>
  );
}
