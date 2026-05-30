import { create } from "zustand";

/** Where fenced ```html``` previews run by default; persisted for the webview origin. */
export type HtmlPreviewDeliveryMode = "sandbox" | "browser" | "both";

export const HTML_PREVIEW_DELIVERY_STORAGE_KEY = "ternion.sensorStudio.assistant.htmlPreviewDelivery";

/** When true, ```html``` iframe uses allow-scripts allow-popups (no allow-same-origin). Default off. */
export const HTML_PREVIEW_SANDBOX_SCRIPTS_STORAGE_KEY =
  "ternion.sensorStudio.assistant.htmlPreviewSandboxAllowScripts";

export const HTML_PREVIEW_DELIVERY_LABELS: Record<
  HtmlPreviewDeliveryMode,
  { title: string; hint: string }
> = {
  sandbox: {
    title: "Sandbox only",
    hint: "Inline iframe preview (scripts off by default). Each HTML block still has Open in browser in its toolbar.",
  },
  browser: {
    title: "System browser only",
    hint: "No inline iframe — use Open in browser on each HTML block (toolbar). Scripts and CDN assets usually work.",
  },
  both: {
    title: "Sandbox + browser",
    hint: "Inline sandbox preview. Open in browser is always on each HTML block toolbar.",
  },
};

function parseDeliveryMode(raw: string | null | undefined): HtmlPreviewDeliveryMode {
  if (raw === "browser" || raw === "both") {
    return raw;
  }
  return "sandbox";
}

function loadInitialMode(): HtmlPreviewDeliveryMode {
  try {
    return parseDeliveryMode(localStorage.getItem(HTML_PREVIEW_DELIVERY_STORAGE_KEY));
  } catch {
    return "sandbox";
  }
}

function persistMode(mode: HtmlPreviewDeliveryMode): void {
  try {
    localStorage.setItem(HTML_PREVIEW_DELIVERY_STORAGE_KEY, mode);
  } catch {
    // ignore
  }
}

function loadInitialSandboxAllowScripts(): boolean {
  try {
    if (typeof localStorage === "undefined") {
      return false;
    }
    return localStorage.getItem(HTML_PREVIEW_SANDBOX_SCRIPTS_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function persistSandboxAllowScripts(allow: boolean): void {
  try {
    localStorage.setItem(HTML_PREVIEW_SANDBOX_SCRIPTS_STORAGE_KEY, allow ? "1" : "0");
  } catch {
    // ignore
  }
}

export type HtmlPreviewDeliveryState = {
  deliveryMode: HtmlPreviewDeliveryMode;
  setDeliveryMode: (mode: HtmlPreviewDeliveryMode) => void;
  /** Inline iframe: allow JS + window.open popups (still sandboxed; never allow-same-origin with scripts). */
  htmlPreviewSandboxAllowScripts: boolean;
  setHtmlPreviewSandboxAllowScripts: (allow: boolean) => void;
};

export const useHtmlPreviewDeliveryStore = create<HtmlPreviewDeliveryState>((set) => ({
  deliveryMode: typeof localStorage === "undefined" ? "sandbox" : loadInitialMode(),
  setDeliveryMode: (deliveryMode) => {
    set({ deliveryMode });
    persistMode(deliveryMode);
  },
  htmlPreviewSandboxAllowScripts:
    typeof localStorage === "undefined" ? false : loadInitialSandboxAllowScripts(),
  setHtmlPreviewSandboxAllowScripts: (htmlPreviewSandboxAllowScripts) => {
    set({ htmlPreviewSandboxAllowScripts });
    persistSandboxAllowScripts(htmlPreviewSandboxAllowScripts);
  },
}));

/**
 * Opens HTML in a new tab/window. Popup blockers may prevent `window.open`; a download fallback
 * is attempted.
 *
 * Prefer writing into an `about:blank` tab instead of navigating to `blob:`. In Chromium, a
 * `blob:` opened from isolated browsing contexts (or with certain feature flags / blockers) can
 * fail to resolve, and users often end up with the blob string treated as a search query (Google).
 */
export function openAssistantHtmlInBrowser(html: string): boolean {
  try {
    // Most reliable path: open a blank tab and write the HTML directly.
    // This avoids `blob:` navigation quirks and keeps assets/scripts working as usual.
    const w = window.open("", "_blank");
    if (w != null) {
      w.document.open();
      w.document.write(html);
      w.document.close();
      return true;
    }

    // Fallback: create a download so users still get the content even if popups are blocked.
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "preview.html";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
    return true;
  } catch {
    return false;
  }
}
