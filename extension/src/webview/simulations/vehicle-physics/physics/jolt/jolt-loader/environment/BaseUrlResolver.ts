/**
 * Base URL Resolution
 * 
 * Automatically resolves the baseUrl for Jolt Physics files based on the environment
 */

import { T3DJoltLoaderConfig } from '../T3DJoltLoaderConfig';
import { isWebviewEnvironment } from './EnvironmentDetector';

/**
 * Automatically resolves the baseUrl for Jolt Physics files based on the environment.
 *
 * Priority:
 * 1. If baseUrl is explicitly provided, use it
 * 2. If in webview and LOCAL_ASSETS_BASE_URI is available, use ${LOCAL_ASSETS_BASE_URI}/jolt
 * 3. If in webview and WEBVIEW_BASE_URI is available, use ${WEBVIEW_BASE_URI}/jolt
 * 4. If in browser (not webview): use '/jolt' (standardized path for all browser apps)
 * 5. Otherwise, use the default baseUrl
 *
 * @param providedBaseUrl - Optional baseUrl explicitly provided by the user
 * @param defaultBaseUrl - Default baseUrl to use if not in webview (default: '/jolt')
 * @returns Resolved baseUrl string
 */
export function resolveBaseUrl(
  providedBaseUrl?: string,
  defaultBaseUrl: string = T3DJoltLoaderConfig.defaultBaseUrl
): string {
  // If baseUrl is explicitly provided, use it (user override)
  if (providedBaseUrl !== undefined && providedBaseUrl !== '') {
    console.log(
      `%c[T3DJoltLoader] Using provided baseUrl: ${providedBaseUrl}`,
      'color: cyan; font-weight: bold'
    );
    return providedBaseUrl;
  }

  // If in webview, try to use LOCAL_ASSETS_BASE_URI first (most common case)
  if (isWebviewEnvironment() && typeof window !== 'undefined') {
    const localAssetsBaseUri = (window as any).LOCAL_ASSETS_BASE_URI;
    if (
      localAssetsBaseUri &&
      typeof localAssetsBaseUri === 'string' &&
      localAssetsBaseUri.trim() !== ''
    ) {
      const resolved = `${localAssetsBaseUri}/jolt`;
      console.log(
        `%c[T3DJoltLoader] ✅ Resolved baseUrl using LOCAL_ASSETS_BASE_URI: ${resolved}`,
        'color: #0f0; font-weight: bold'
      );
      return resolved;
    }

    // Fallback to WEBVIEW_BASE_URI if LOCAL_ASSETS_BASE_URI not available
    const webviewBaseUri = (window as any).WEBVIEW_BASE_URI;
    if (
      webviewBaseUri &&
      typeof webviewBaseUri === 'string' &&
      webviewBaseUri.trim() !== ''
    ) {
      const resolved = `${webviewBaseUri}/jolt`;
      console.log(
        `%c[T3DJoltLoader] ⚠️ Resolved baseUrl using WEBVIEW_BASE_URI (fallback): ${resolved}`,
        'color: #ff0; font-weight: bold'
      );
      return resolved;
    }

    // Debug: Log what we found
    console.warn(
      `%c[T3DJoltLoader] ⚠️ Webview detected but URIs not available:
        - LOCAL_ASSETS_BASE_URI: ${localAssetsBaseUri || 'undefined'}
        - WEBVIEW_BASE_URI: ${webviewBaseUri || 'undefined'}
        Using default: ${defaultBaseUrl}`,
      'color: #f80; font-weight: bold'
    );
  }

  // If in browser (not webview), use standardized path
  // All browser apps (main VehiclePhysicsHost and extension) now use /jolt
  // Extension build copies Jolt to both /jolt and /assets/jolt for backward compatibility
  if (!isWebviewEnvironment() && typeof window !== 'undefined') {
    console.log(
      `%c[T3DJoltLoader] Using browser app baseUrl: ${defaultBaseUrl} (standardized path)`,
      'color: #0ff; font-weight: bold'
    );
    return defaultBaseUrl;
  }

  console.log(
    `%c[T3DJoltLoader] Using default baseUrl: ${defaultBaseUrl}`,
    'color: #0ff; font-weight: bold'
  );

  // Fall back to default
  return defaultBaseUrl;
}
