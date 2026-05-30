import { useCallback, useEffect, useState } from "react";
import {
  AI_BRIDGE_CLIENT_MAX_OUTPUT_TOKENS_MAX,
  AI_BRIDGE_CLIENT_MAX_OUTPUT_TOKENS_MIN,
} from "../../ai/protocol/ai-bridge-protocol";
import {
  clearStoredAnthropicApiKey,
  clearStoredAnthropicMaxOutputTokens,
  getStoredAnthropicApiKey,
  getStoredAnthropicMaxOutputTokens,
  setStoredAnthropicApiKey,
  setStoredAnthropicMaxOutputTokens,
} from "./ai-bridge-webview-config";
import { PANEL_FORM_CONTROL_ROW_CLASS } from "../lib/panel-form-control-classes";
import { TRNButton } from "../ui/TRN/TRNButton";
import { TRNHintText } from "../ui/TRN/TRNHintText";

export type AnthropicApiKeySettingsPanelProps = {
  /**
   * When **`false`**, the parent window is closed — avoid clobbering in-progress edits.
   * When **`true`** (Bitstream modal) or **`undefined`** (embedded e.g. Project 4), reload drafts from **`localStorage`** when the window opens / on first mount.
   */
  settingsOpen?: boolean;
};

function readDraftsFromStorage(): { key: string; maxTokens: string } {
  if (typeof window === "undefined") {
    return { key: "", maxTokens: "" };
  }
  const key = getStoredAnthropicApiKey();
  const s = getStoredAnthropicMaxOutputTokens();
  return { key, maxTokens: s != null ? String(s) : "" };
}

/**
 * Settings UI for Anthropic API key and optional **`max_tokens`** override used by Sensor Studio Assistant and AI Dev Trace
 * (stored in localStorage; sent per-request to the local AI bridge WebSocket).
 */
export function AnthropicApiKeySettingsPanel(props: AnthropicApiKeySettingsPanelProps = {}) {
  const { settingsOpen } = props;
  const [draft, setDraft] = useState(() => readDraftsFromStorage().key);
  const [maxTokensDraft, setMaxTokensDraft] = useState(() => readDraftsFromStorage().maxTokens);
  const [storageHint, setStorageHint] = useState<{
    tone: "ok" | "error";
    text: string;
  } | null>(null);

  /** Bitstream modal: each time the window opens, show what is actually stored (avoids “empty after reopen” confusion). */
  useEffect(() => {
    if (settingsOpen === false) {
      return;
    }
    const { key, maxTokens } = readDraftsFromStorage();
    setDraft(key);
    setMaxTokensDraft(maxTokens);
  }, [settingsOpen]);

  const onSave = useCallback(() => {
    const trimmedKey = draft.trim();
    const trimmedTok = maxTokensDraft.trim();
    const errors: string[] = [];

    if (!setStoredAnthropicApiKey(draft)) {
      errors.push("API key could not be written to localStorage.");
    } else if (trimmedKey.length > 0 && getStoredAnthropicApiKey() !== trimmedKey) {
      errors.push("API key read-back mismatch after save.");
    }

    if (trimmedTok.length === 0) {
      clearStoredAnthropicMaxOutputTokens();
    } else {
      const n = Number.parseInt(trimmedTok, 10);
      if (!Number.isFinite(n)) {
        errors.push(
          `Max output tokens must be an integer between ${AI_BRIDGE_CLIENT_MAX_OUTPUT_TOKENS_MIN} and ${AI_BRIDGE_CLIENT_MAX_OUTPUT_TOKENS_MAX}.`,
        );
      } else if (!setStoredAnthropicMaxOutputTokens(n)) {
        errors.push("Max output tokens could not be written to localStorage.");
      }
    }

    if (errors.length > 0) {
      setStorageHint({ tone: "error", text: errors.join(" ") });
      return;
    }

    const { key: savedKey, maxTokens: savedMaxStr } = readDraftsFromStorage();
    setDraft(savedKey);
    setMaxTokensDraft(savedMaxStr);

    const savedTok = getStoredAnthropicMaxOutputTokens();
    const tokNote =
      savedTok != null
        ? ` Max output tokens ${savedTok} is stored and sent as maxOutputTokens on every assistant request (restart bridge not required).`
        : " No stored max output tokens — the bridge uses AI_BRIDGE_MAX_OUTPUT_TOKENS or its built-in default (4096).";

    setStorageHint({
      tone: "ok",
      text:
        trimmedKey.length > 0
          ? `Saved locally (${trimmedKey.length} API key characters).${tokNote} A 401 means Anthropic rejected the key.`
          : `Saved — stored API key cleared (empty).${tokNote}`,
    });
  }, [draft, maxTokensDraft]);

  const onClear = useCallback(() => {
    clearStoredAnthropicApiKey();
    setDraft("");
    const gone = getStoredAnthropicApiKey().length === 0;
    setStorageHint({
      tone: gone ? "ok" : "error",
      text: gone ? "Cleared API key from localStorage." : "Clear ran but key still reads back — storage may be blocked.",
    });
  }, []);

  const onClearTokenLimit = useCallback(() => {
    clearStoredAnthropicMaxOutputTokens();
    setMaxTokensDraft("");
    setStorageHint({
      tone: "ok",
      text: "Cleared stored max output tokens — the bridge will use its default (see AI Bridge env).",
    });
  }, []);

  return (
    <div className="flex flex-col gap-3 text-zinc-100">
      <p className="text-xs leading-relaxed text-zinc-400">
        Used for chat with the local AI bridge (<span className="font-mono text-zinc-500">ws://127.0.0.1:9987</span>
        ). The bridge receives the key over WebSocket per request; it does not persist the key to disk.
      </p>
      <div>
        <label className="text-[10px] uppercase tracking-wide text-zinc-500">API key</label>
        <input
          type="password"
          autoComplete="off"
          spellCheck={false}
          className={PANEL_FORM_CONTROL_ROW_CLASS}
          placeholder="sk-ant-api03-…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-wide text-zinc-500">
          Max output tokens (optional)
        </label>
        <input
          type="number"
          inputMode="numeric"
          min={AI_BRIDGE_CLIENT_MAX_OUTPUT_TOKENS_MIN}
          max={AI_BRIDGE_CLIENT_MAX_OUTPUT_TOKENS_MAX}
          step={64}
          autoComplete="off"
          spellCheck={false}
          className={PANEL_FORM_CONTROL_ROW_CLASS}
          placeholder={`${AI_BRIDGE_CLIENT_MAX_OUTPUT_TOKENS_MIN}–${AI_BRIDGE_CLIENT_MAX_OUTPUT_TOKENS_MAX}, blank = bridge default`}
          value={maxTokensDraft}
          onChange={(e) => setMaxTokensDraft(e.target.value)}
        />
        <p className="mt-1 text-[10px] leading-snug text-zinc-600">
          Anthropic <span className="font-mono text-zinc-500">max_tokens</span> per completion — stored in this browser
          only (not sent to Anthropic until you chat). Larger values help long HTML finish; they cost more. You must click{" "}
          <span className="font-semibold text-zinc-400">Save locally</span> after changing this field. Leave blank for the
          bridge default (<span className="font-mono">AI_BRIDGE_MAX_OUTPUT_TOKENS</span> or <span className="font-mono">4096</span>
          ). If HTML still cuts off with <span className="font-mono">8192</span>, shorten the page or split the reply.
        </p>
      </div>
      {storageHint != null ? (
        <TRNHintText tone={storageHint.tone === "error" ? "warn" : "info"} className="text-[11px]">
          {storageHint.text}
        </TRNHintText>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <TRNButton type="button" size="compact" onClick={onSave}>
          Save locally
        </TRNButton>
        <TRNButton
          type="button"
          size="compact"
          className="border-zinc-600/80 bg-zinc-950/60 hover:bg-zinc-900/75"
          onClick={onClear}
        >
          Clear API key
        </TRNButton>
        <TRNButton
          type="button"
          size="compact"
          className="border-zinc-600/80 bg-zinc-950/60 hover:bg-zinc-900/75"
          onClick={onClearTokenLimit}
          title="Remove stored max_tokens override"
        >
          Clear token limit
        </TRNButton>
      </div>
      <p className="text-[10px] leading-snug text-zinc-500">
        Stored in this browser only (localStorage). For packaged VS Code builds, consider migrating to Secret Storage later.
      </p>
      <p className="text-[10px] leading-snug text-zinc-600">
        If the AI bridge requires a pairing token (<span className="font-mono">AI_BRIDGE_PAIRING_TOKEN</span>), set it
        under the menu → <span className="text-zinc-400">AI Bridge Settings</span>.
      </p>
    </div>
  );
}
