/**
 * COI (Cross-Origin Isolation) Manager
 * 
 * Handles service worker registration and COI initialization for SharedArrayBuffer support
 */

import { T3DJoltLoaderConfig } from '../T3DJoltLoaderConfig';
import { isWebviewEnvironment } from '../environment/EnvironmentDetector';

/**
 * COI initialization options
 */
export interface COIInitOptions {
  serviceWorkerPath?: string;
  quiet?: boolean;
  maxWaitTime?: number;
  retryAttempts?: number;
}

/**
 * Helper function to check if COI is ready
 */
function isCOIReady(): boolean {
  return (
    typeof SharedArrayBuffer !== 'undefined' &&
    typeof Atomics !== 'undefined' &&
    (globalThis as any).crossOriginIsolated === true
  );
}

/**
 * COI (Cross-Origin Isolation) initialization with retry logic
 * Enables SharedArrayBuffer for multi-threaded Jolt Physics
 */
export async function initializeCOI(options?: COIInitOptions): Promise<boolean> {
  // Step 1: Extract options with defaults
  const {
    // Service worker file location:
    // - VehiclePhysicsHost project: public/t3d-coi-serviceworker.js
    // - Extension project: apps/t3d-extension/out/webview/t3d-coi-serviceworker.js (copied during build)
    serviceWorkerPath = T3DJoltLoaderConfig.defaultServiceWorkerPath,
    quiet = false,
    maxWaitTime = T3DJoltLoaderConfig.coi.defaultMaxWaitTime,
    retryAttempts = T3DJoltLoaderConfig.retry.defaultAttempts,
  } = options || {};

  // Step 2: Check if already cross-origin isolated
  if (isCOIReady()) {
    if (!quiet) {
      console.log('✅ COI already enabled, SharedArrayBuffer available');
    }
    return true;
  }

  // Step 3: Check if running in VSCode webview (service workers not supported)
  //         Note: This is expected behavior in webviews, not an error
  if (isWebviewEnvironment()) {
    if (!quiet) {
      console.log(
        'ℹ️ COI initialization skipped: service workers not supported in VSCode webview (single-threaded mode will be used)'
      );
    }
    return false;
  }

  // Step 3b: VehiclePhysicsHost Vite dev skips COI via VehiclePhysicsHost/src/main.tsx (import.meta.env.DEV) so any dev port
  // can load cross-origin thumbnails; production / preview builds still use this function as usual.

  // Step 4: Check if in secure context (required for service workers)
  if (typeof window === 'undefined' || !window.isSecureContext) {
    if (!quiet) {
      console.warn(
        '⚠️ COI initialization skipped: secure context required (HTTPS or localhost)'
      );
    }
    return false;
  }

  // Step 5: Check if service worker is supported
  if (
    typeof navigator === 'undefined' ||
    !navigator.serviceWorker ||
    !('register' in navigator.serviceWorker)
  ) {
    if (!quiet) {
      console.warn(
        '⚠️ COI initialization skipped: service workers not supported'
      );
    }
    return false;
  }

  // Step 6: Check sessionStorage to avoid reload loops (with safe access)
  let reloadedBySelf: string | null = null;
  try {
    reloadedBySelf = sessionStorage.getItem('coiReloadedBySelf');
    if (reloadedBySelf) {
      sessionStorage.removeItem('coiReloadedBySelf');
      if (!quiet) {
        console.log('ℹ️ COI reload detected, continuing initialization...');
      }
    }
  } catch {
    // Ignore - sessionStorage may not be available in some environments
  }

  // Step 7: Retry logic for service worker registration
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retryAttempts; attempt++) {
    try {
      // Step 7.1: Register the COI service worker
      const registration = await navigator.serviceWorker.register(
        serviceWorkerPath,
        {
          updateViaCache: 'none', // Always check for updates
        }
      );

      if (!quiet && attempt === 0) {
        console.log('📋 COI Service Worker registered:', registration.scope);
        console.log('  Service Worker URL:', serviceWorkerPath);
      }

      // Step 7.2: Handle service worker updates
      registration.addEventListener('updatefound', () => {
        if (!quiet) {
          console.log(
            '🔄 COI Service Worker update found, reloading page...'
          );
        }
        try {
          sessionStorage.setItem('coiReloadedBySelf', 'updatefound');
        } catch {
          // Ignore - sessionStorage may not be available
        }
        window.location.reload();
      });

      // Step 7.3: Check if service worker is active but not controlling (needs reload)
      if (registration.active && !navigator.serviceWorker.controller) {
        if (!quiet) {
          console.log(
            '🔄 COI Service Worker active but not controlling, reloading page...'
          );
        }
        try {
          sessionStorage.setItem('coiReloadedBySelf', 'notcontrolling');
        } catch {
          // Ignore - sessionStorage may not be available
        }
        window.location.reload();
        return false; // Will reload, so this promise won't resolve
      }

      // Step 7.4: Wait for COI to be ready
      const startTime = Date.now();
      const checkInterval = T3DJoltLoaderConfig.coi.checkInterval;

      while (!isCOIReady() && Date.now() - startTime < maxWaitTime) {
        await new Promise((resolve) => setTimeout(resolve, checkInterval));
      }

      if (isCOIReady()) {
        if (!quiet) {
          console.log(
            '✅ COI enabled successfully, SharedArrayBuffer available'
          );
        }
        return true;
      } else {
        throw new Error(
          `COI initialization timeout: COI not ready after ${maxWaitTime}ms`
        );
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Step 7.5: Retry if not the last attempt
      if (attempt < retryAttempts) {
        if (!quiet) {
          console.warn(
            `⚠️ COI initialization attempt ${attempt + 1} failed, retrying...`
          );
        }
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (attempt + 1))
        );
        continue;
      }

      // Step 7.6: Last attempt failed
      if (!quiet) {
        console.error(
          '❌ COI Service Worker registration failed after retries:',
          lastError
        );
      }
      return false;
    }
  }

  return false;
}
