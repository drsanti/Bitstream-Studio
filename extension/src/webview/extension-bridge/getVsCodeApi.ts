declare function acquireVsCodeApi(): {
  postMessage: (message: unknown) => void;
};

declare global {
  interface Window {
    __VSCODE_API__?: ReturnType<typeof acquireVsCodeApi>;
  }
}

let cachedApi: ReturnType<typeof acquireVsCodeApi> | null = null;
let acquireAttempted = false;

/**
 * VS Code webview API singleton. Prefers `window.__VSCODE_API__` injected before ES modules load.
 * Avoids calling `acquireVsCodeApi()` twice (throws in the real webview).
 */
export function getVsCodeApi(): ReturnType<typeof acquireVsCodeApi> | null
{
  if (cachedApi)
  {
    return cachedApi;
  }

  if (typeof window !== "undefined" && window.__VSCODE_API__)
  {
    cachedApi = window.__VSCODE_API__;
    acquireAttempted = true;
    return cachedApi;
  }

  if (!acquireAttempted)
  {
    try
    {
      if (typeof acquireVsCodeApi !== "undefined")
      {
        cachedApi = acquireVsCodeApi();
        acquireAttempted = true;
      }
    }
    catch (error)
    {
      console.warn("VS Code API already acquired or not available:", error);
      acquireAttempted = true;
    }
  }

  return cachedApi;
}
