/*******************************************************************************
 * File Name : isViteDevMode.ts
 *
 * Description : Safe Vite dev detection for browser shell URL helpers.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

/**
 * True when running the Vite dev server (not packaged VSIX webview).
 * Falls back to localhost hostname when import.meta.env is unavailable.
 */
export function isViteDevMode(): boolean
{
  try
  {
    const env = import.meta.env;
    if (env != null && typeof env.DEV === "boolean")
    {
      return env.DEV;
    }
  }
  catch
  {
    // ignore — non-Vite or partial bundle
  }

  if (typeof window === "undefined")
  {
    return false;
  }

  const hostname = window.location.hostname;
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]"
  );
}
