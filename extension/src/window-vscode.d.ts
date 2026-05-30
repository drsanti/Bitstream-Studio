/**
 * VS Code webview injects `acquireVsCodeApi()` result on `window` before ES modules load.
 * Extension HTML may set `EXTENSION_PATH` for default paths.
 * Declared here (not only under `src/webview/`) so the extension root `tsconfig.json`
 * — which excludes `src/webview` — still type-checks files that reference these globals.
 */
declare global {
  interface Window {
    /** VS Code API acquired in HTML script before modules load (for folder picker, config, etc.) */
    __VSCODE_API__?: { postMessage: (message: unknown) => void };
    /** Extension installation path (for default download output path) */
    EXTENSION_PATH?: string;
  }
}

export {};
