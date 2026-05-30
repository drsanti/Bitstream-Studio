export type WebviewShellEntry = "digitalTwin" | "bitstream" | "bitstream2Sim";

type TernionWebviewEntry = "digitalTwin" | "project4" | "bitstream";

const STORAGE_KEY = "ternion.webview.entry";

export function isTernionWebviewEntry(value: string | null | undefined): value is TernionWebviewEntry {
  return value === "digitalTwin" || value === "project4" || value === "bitstream";
}

export function isWebviewShellEntry(value: string | null | undefined): value is WebviewShellEntry {
  return (
    value === "digitalTwin" ||
    value === "bitstream" ||
    value === "bitstream2Sim"
  );
}

export function normalizeShellEntry(entry: TernionWebviewEntry | WebviewShellEntry): WebviewShellEntry {
  if (entry === "bitstream") {
    return "bitstream";
  }
  if (entry === "bitstream2Sim") {
    return "bitstream2Sim";
  }
  return "digitalTwin";
}

export function readPersistedWebviewEntry(): WebviewShellEntry | null {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (isWebviewShellEntry(raw)) {
      return raw;
    }
    if (!isTernionWebviewEntry(raw)) {
      return null;
    }
    return normalizeShellEntry(raw);
  } catch {
    return null;
  }
}

export function persistWebviewEntry(entry: WebviewShellEntry): void {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, entry);
  } catch {
    // ignore quota / private mode
  }
}
