export type WebviewShellEntry = "bitstream";

type TernionWebviewEntry = "bitstream";

const STORAGE_KEY = "ternion.webview.entry";

export function isTernionWebviewEntry(value: string | null | undefined): value is TernionWebviewEntry
{
  return value === "bitstream";
}

export function isWebviewShellEntry(value: string | null | undefined): value is WebviewShellEntry
{
  return value === "bitstream";
}

export function normalizeShellEntry(_entry: TernionWebviewEntry | WebviewShellEntry): WebviewShellEntry
{
  return "bitstream";
}

export function readPersistedWebviewEntry(): WebviewShellEntry | null
{
  if (typeof window === "undefined" || typeof window.localStorage === "undefined")
  {
    return null;
  }
  try
  {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "bitstream" || raw === "bitstream2Sim" || raw === "digitalTwin")
    {
      return "bitstream";
    }
    return null;
  }
  catch
  {
    return null;
  }
}

export function persistWebviewEntry(_entry: WebviewShellEntry): void
{
  if (typeof window === "undefined" || typeof window.localStorage === "undefined")
  {
    return;
  }
  try
  {
    window.localStorage.setItem(STORAGE_KEY, "bitstream");
  }
  catch
  {
    // ignore quota / private mode
  }
}
