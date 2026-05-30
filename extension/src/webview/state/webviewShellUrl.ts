import type { WebviewShellEntry } from "./webviewEntryPersistence.js";
import { readPersistedWebviewEntry } from "./webviewEntryPersistence.js";

export type WebviewShellUrlState = {
  showLauncher: boolean;
  entry: WebviewShellEntry;
};

/** Browser dev shell: shortcuts and URL bar navigation (not VS Code host). */
export function isBrowserShellEnvironment(): boolean
{
  if (typeof window === "undefined")
  {
    return false;
  }
  if (window.WEBVIEW_READY === true)
  {
    return false;
  }
  return import.meta.env.DEV;
}

function parseLocation(href: string): WebviewShellUrlState | null
{
  if (!isBrowserShellEnvironment())
  {
    return null;
  }
  try
  {
    new URL(href, window.location.origin);
    return { showLauncher: false, entry: "bitstream" };
  }
  catch
  {
    return null;
  }
}

/** Read `entry` from the current URL (browser dev). */
export function readShellStateFromUrl(href?: string): WebviewShellUrlState | null
{
  if (typeof window === "undefined")
  {
    return null;
  }
  return parseLocation(href ?? window.location.href);
}

function readHostShellBootstrap(): WebviewShellUrlState | null
{
  if (typeof window === "undefined" || window.WEBVIEW_READY !== true)
  {
    return null;
  }
  return {
    showLauncher: false,
    entry: "bitstream",
  };
}

/** Bootstrap: VS Code host, then URL (browser dev), then persisted default. */
export function readShellBootstrapFromUrl(): WebviewShellUrlState
{
  const fromHost = readHostShellBootstrap();
  if (fromHost != null)
  {
    return fromHost;
  }
  const fromUrl = readShellStateFromUrl();
  if (fromUrl != null)
  {
    return fromUrl;
  }
  return {
    showLauncher: false,
    entry: readPersistedWebviewEntry() ?? "bitstream",
  };
}

export type WriteShellUrlOptions = {
  showLauncher: boolean;
  entry: WebviewShellEntry;
  /** Use pushState so browser Back returns to the previous shell URL. */
  usePushState?: boolean;
};

/** No-op: Bitstream Studio uses toolbar tabs + localStorage (no `?app=` URL routing). */
export function writeShellUrl(_options: WriteShellUrlOptions): void
{
  // intentionally empty
}
