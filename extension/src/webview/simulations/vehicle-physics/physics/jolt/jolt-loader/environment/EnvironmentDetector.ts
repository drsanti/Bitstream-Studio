/**
 * Environment Detection Utilities
 * 
 * Detects the environment type (webview vs browser) where the application is running
 */

/**
 * Detect if running in a VSCode webview environment
 * @returns true if running in a webview, false otherwise
 */
export function isWebviewEnvironment(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const w = window as unknown as {
    WEBVIEW_READY?: boolean;
    __VSCODE_API__?: unknown;
    acquireVsCodeApi?: unknown;
  };
  return (
    w.WEBVIEW_READY === true ||
    w.__VSCODE_API__ != null ||
    typeof w.acquireVsCodeApi === 'function' ||
    (typeof window.location !== 'undefined' &&
      (window.location.origin.startsWith('vscode-webview://') ||
        window.location.href.includes('vscode-webview')))
  );
}

/**
 * Detect the environment type where the application is running
 * @returns 'Webview' if running in a webview (e.g., VS Code/Cursor extension),
 *          'Browser' if running in a regular browser, or null if detection fails
 */
export function getEnvironmentType(): 'Browser' | 'Webview' | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const isWebview = isWebviewEnvironment();
  return isWebview ? 'Webview' : 'Browser';
}
