import type { WebviewShellEntry } from "./webviewEntryPersistence.js";
import { normalizeShellEntry, readPersistedWebviewEntry } from "./webviewEntryPersistence.js";
import type { TernionWebviewEntry } from "../ternion-webview-entry.js";

export type WebviewShellUrlState = {
  showLauncher: boolean;
  entry: WebviewShellEntry;
};

/** Browser dev shell: shortcuts and URL bar navigation (not VS Code host). */
export function isBrowserShellEnvironment(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  if (window.WEBVIEW_READY === true) {
    return false;
  }
  return import.meta.env.DEV;
}

function parseLocation(href: string): WebviewShellUrlState | null {
  if (!isBrowserShellEnvironment()) {
    return null;
  }
  try {
    const params = new URLSearchParams(new URL(href, window.location.origin).search);
    if (params.get("launcher") === "1") {
      return {
        showLauncher: true,
        entry: readPersistedWebviewEntry() ?? "digitalTwin",
      };
    }

    const app = params.get("app")?.trim() ?? "";
    if (app === "digitalTwin" || app === "myApp") {
      return { showLauncher: false, entry: "digitalTwin" };
    }
    if (app === "bitstream" || app === "sensor-studio") {
      return {
        showLauncher: false,
        entry: "bitstream",
      };
    }
    if (app === "bitstream2-sim" || app === "bitstream2") {
      return {
        showLauncher: false,
        entry: "bitstream2Sim",
      };
    }

    if (app.length === 0) {
      return {
        showLauncher: true,
        entry: readPersistedWebviewEntry() ?? "digitalTwin",
      };
    }

    return null;
  } catch {
    return null;
  }
}

/** Read `entry` / launcher visibility / Bitstream workspace from the current URL. */
export function readShellStateFromUrl(href?: string): WebviewShellUrlState | null {
  if (typeof window === "undefined") {
    return null;
  }
  return parseLocation(href ?? window.location.href);
}

function readHostShellBootstrap(): WebviewShellUrlState | null {
  if (typeof window === "undefined" || window.WEBVIEW_READY !== true) {
    return null;
  }
  const host = window.TERNION_WEBVIEW_APP as TernionWebviewEntry | undefined;
  const entry = normalizeShellEntry(
    host === "bitstream" || host === "digitalTwin" || host === "project4"
      ? host
      : "digitalTwin",
  );
  return {
    showLauncher: false,
    entry,
  };
}

/** Bootstrap: VS Code host app, then URL (browser dev), then persisted launcher home. */
export function readShellBootstrapFromUrl(): WebviewShellUrlState {
  const fromHost = readHostShellBootstrap();
  if (fromHost != null) {
    return fromHost;
  }
  const fromUrl = readShellStateFromUrl();
  if (fromUrl != null) {
    return fromUrl;
  }
  return {
    showLauncher: true,
    entry: readPersistedWebviewEntry() ?? "digitalTwin",
  };
}

export type WriteShellUrlOptions = {
  showLauncher: boolean;
  entry: WebviewShellEntry;
  /** Use pushState so browser Back returns to the previous shell URL. */
  usePushState?: boolean;
};

/** Write canonical dev URLs for launcher / apps (any pathname, e.g. `/` or `/index.html`). */
export function writeShellUrl(options: WriteShellUrlOptions): void {
  if (!isBrowserShellEnvironment()) {
    return;
  }
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete("launcher");
    url.searchParams.delete("app");

    if (options.showLauncher) {
      url.searchParams.set("launcher", "1");
    } else if (options.entry === "digitalTwin") {
      url.searchParams.set("app", "digitalTwin");
    } else if (options.entry === "bitstream2Sim") {
      url.searchParams.set("app", "bitstream2-sim");
    } else {
      url.searchParams.set("app", "bitstream");
    }

    const next = `${url.pathname}${url.search ? url.search : ""}${url.hash}`;
    if (options.usePushState) {
      window.history.pushState({}, "", next);
    } else {
      window.history.replaceState({}, "", next);
    }
  } catch {
    // ignore
  }
}
