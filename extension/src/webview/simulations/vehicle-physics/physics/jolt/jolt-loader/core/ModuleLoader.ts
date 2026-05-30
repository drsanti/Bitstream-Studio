/**
 * ES Module Loader
 * 
 * Loads ES modules with hybrid approach: try direct import first (CSP-friendly), fallback to blob
 * Handles CSP constraints in webview environments
 */

import { T3DJoltLoaderConfig } from '../T3DJoltLoaderConfig';
import { isWebviewEnvironment } from '../environment/EnvironmentDetector';
import type { JoltModule } from '../types';

/**
 * Emscripten module initialization options
 * These options are passed to the Jolt factory function when initializing the WASM module
 */
export interface EmscriptenModuleOptions {
  /** Function to locate WASM and other files (maps file paths to URLs) */
  locateFile?: (path: string) => string;
  /** Main script URL or blob URL for multi-threaded builds */
  mainScriptUrlOrBlob?: string;
  /** Thread pool size for multi-threaded builds */
  pthreadPoolSize?: number;
}

export type JoltModuleFactory = (
  opts?: EmscriptenModuleOptions
) => Promise<JoltModule>;

/**
 * True when glue must be loaded via fetch (not dynamic import).
 * Includes /public paths, extension webview URIs, and http(s) asset roots.
 */
function shouldFetchModuleFirst(src: string): boolean
{
  if (src.startsWith('/'))
  {
    return true;
  }
  return /^(https?:|vscode-webview:)/i.test(src);
}

/**
 * Load ES module with hybrid approach: try direct import first (CSP-friendly), fallback to blob
 * Emscripten modules export the factory as default export
 *
 * Note: In VSCode webviews, blob import is avoided due to CSP constraints.
 * Direct import is preferred, and blob fallback is only used in browser environments.
 *
 * Note: For files in /public directory, we skip direct import and use fetch+blob
 * because Vite doesn't allow importing public assets directly in source code.
 */
export async function loadModuleFactory(
  src: string,
  retryAttempts: number = T3DJoltLoaderConfig.retry.loadModuleAttempts,
  retryDelay: number = T3DJoltLoaderConfig.retry.defaultDelay
): Promise<JoltModuleFactory> {
  let lastError: Error | null = null;
  const isWebview = isWebviewEnvironment();

  const fetchFirst = shouldFetchModuleFirst(src);

  // Step 1: Retry loop for loading the module
  for (let attempt = 0; attempt <= retryAttempts; attempt++) {
    try {
      // Step 1.1: Try direct dynamic import first (best for CSP compatibility)
      // Skip for fetch-first URLs (public /jolt, vscode-webview asset roots, http(s))
      if (!fetchFirst) {
        try {
          const mod = await import(/* @vite-ignore */ src);
          if (typeof mod.default === 'function') {
            // Step 1.1.1: Store metadata for debugging instead of window.Jolt
            if (typeof window !== 'undefined') {
              (window as any).__JOLT_GLUE_URL__ = src;
            }
            return mod.default;
          }
        } catch (importError) {
          // Direct import failed
          lastError =
            importError instanceof Error
              ? importError
              : new Error(String(importError));

          // Step 1.1.2: In webviews, don't try blob import (CSP issues)
          if (isWebview) {
            // Re-throw the import error in webview (no blob fallback)
            throw lastError;
          }
          // Fall through to blob fallback for browser environments
        }
      } else {
        // For public assets, skip direct import and go straight to fetch+blob
        // This prevents Vite from trying to resolve /public files during dev server startup
        // Note: For public assets, we must use fetch+blob even in webviews since direct import doesn't work
      }

      // Step 1.2: Fallback: fetch + blob + import
      // Required for /jolt and extension asset URIs; also used in browser when direct import fails
      if (fetchFirst || !isWebview) {
        const response = await fetch(src);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch module: ${response.status} ${response.statusText}`
          );
        }
        // Step 1.2.1: Get module text content
        const moduleText = await response.text();

        // Step 1.2.2: Create blob URL from module text
        const blobUrl = URL.createObjectURL(
          new Blob([moduleText], { type: 'application/javascript' })
        );

        try {
          // Step 1.2.3: Import from blob URL
          const mod = await import(/* @vite-ignore */ blobUrl);
          const factory = mod.default;
          if (typeof factory !== 'function') {
            throw new Error(
              `Module default export is not a function, got: ${typeof factory}`
            );
          }

          // Step 1.2.4: Store metadata for debugging
          if (typeof window !== 'undefined') {
            (window as any).__JOLT_GLUE_URL__ = src;
          }

          return factory;
        } finally {
          // Step 1.2.5: Clean up blob URL
          URL.revokeObjectURL(blobUrl);
        }
      } else {
        // Non-public asset in webview: direct import failed and blob import not allowed (CSP)
        throw lastError || new Error(`Cannot load module in webview: ${src}`);
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Step 1.3: Retry if not the last attempt
      if (attempt < retryAttempts) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        continue;
      }

      // Step 1.4: Last attempt failed, throw error
      throw new Error(
        `Failed to load module after ${attempt + 1} attempts: ${src}. ${lastError.message}`
      );
    }
  }

  throw lastError || new Error(`Failed to load module: ${src}`);
}
