/**
 * Enhanced Jolt Physics Loader with improved error handling, configuration, and monitoring
 *
 * Improvements over utils.ts:
 * - Better error handling with graceful degradation
 * - Thread pool configuration and auto-detection
 * - Reduced verbose logging (summary instead of per-worker)
 * - Performance monitoring
 * - Worker health checks
 * - Retry logic for failed operations
 * - Comprehensive TypeScript types
 */

import { T3DJoltLoaderConfig } from './T3DJoltLoaderConfig';

// Re-export all types from the centralized types file
export type * from './types';

// Import modular components
import { getEnvironmentType } from './environment/EnvironmentDetector';
import { resolveBaseUrl } from './environment/BaseUrlResolver';
import { getOptimalWorkerThreadCount } from './core/ThreadPoolManager';
import { initialize, disposeJoltLoaderBlobs, restoreWorkerConstructor } from './workers/WorkerManager';
import { checkWorkers, testWorkerCreation, canUseWasmThreads } from './workers/WorkerDiagnostics';
import { initializeCOI, type COIInitOptions } from './coi/COIManager';
import { loadJolt, getJolt, getWorkerThreadCount, type JoltLoadOptions, type JoltLoadResult } from './core/JoltModuleLoader';

// Re-export interfaces for public API
export type { JoltLoadOptions, JoltLoadResult, COIInitOptions };

/**
 * T3DJoltLoader - Enhanced Jolt Physics Loader Class
 *
 * Provides comprehensive Jolt Physics loading with error handling,
 * configuration, and monitoring capabilities.
 *
 * This class acts as a facade that delegates to modular components:
 * - Environment detection and base URL resolution
 * - Worker management and diagnostics
 * - COI (Cross-Origin Isolation) initialization
 * - Jolt Physics module loading
 */
export class T3DJoltLoader {
  /**
   * Auto-detect optimal worker thread count based on CPU cores
   */
  static getOptimalWorkerThreadCount = getOptimalWorkerThreadCount;

  /**
   * Get the worker thread count from the last successful Jolt load
   * @returns The worker thread count, or undefined if Jolt hasn't been loaded yet
   */
  static getWorkerThreadCount = getWorkerThreadCount;

  /**
   * Get the Jolt module from the last successful load
   * @returns The Jolt module, or undefined if Jolt hasn't been loaded yet
   */
  static getJolt = getJolt;

  /**
   * Detect the environment type where the application is running
   * @returns 'Webview' if running in a webview (e.g., VS Code/Cursor extension),
   *          'Browser' if running in a regular browser, or null if detection fails
   */
  static getEnvironmentType = getEnvironmentType;

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
  static resolveBaseUrl = resolveBaseUrl;

  /**
   * Manual cleanup function (useful for HMR/dev scenarios)
   * Resets worker creation counter since blob URLs are cleaned up immediately after use
   */
  static disposeJoltLoaderBlobs = disposeJoltLoaderBlobs;

  /**
   * Restore the original Worker constructor (undo patching)
   * Useful for compatibility with other libraries that need the original Worker
   */
  static restoreWorkerConstructor = restoreWorkerConstructor;

  /**
   * Load Jolt Physics with enhanced error handling and configuration
   */
  static async loadJolt(options: JoltLoadOptions): Promise<JoltLoadResult> {
    // Ensure worker manager is initialized
    initialize();
    return loadJolt(options);
  }

  /**
   * Check if WASM threads can be used (requires COI)
   */
  static canUseWasmThreads = canUseWasmThreads;

  /**
   * COI (Cross-Origin Isolation) initialization with retry logic
   * Enables SharedArrayBuffer for multi-threaded Jolt Physics
   */
  static initializeCOI = initializeCOI;

  /**
   * Enhanced worker status check with detailed information
   */
  static checkWorkers = checkWorkers;

  /**
   * Test worker creation with error handling
   */
  static testWorkerCreation = testWorkerCreation;

  /**
   * Enhanced Jolt initialization with comprehensive error handling and monitoring
   */
  static async initializeJolt(options?: {
    baseUrl?: string;
    maxWorkerThreads?: number;
    quiet?: boolean;
  }): Promise<JoltLoadResult> {
    // Step 1: Extract options with defaults and resolve baseUrl automatically
    const {
      baseUrl: providedBaseUrl,
      maxWorkerThreads = T3DJoltLoaderConfig.threadPool.defaultMaxWorkerThreads,
      quiet = false,
    } = options || {};

    // Automatically resolve baseUrl for webviews if not explicitly provided
    const baseUrl = T3DJoltLoader.resolveBaseUrl(providedBaseUrl);

    // Debug: Log the resolved baseUrl
    if (!quiet) {
      console.log(
        `%c[T3DJoltLoader] initializeJolt() using baseUrl: ${baseUrl}`,
        'color: #0ff; font-weight: bold'
      );
    }

    if (!quiet) {
      console.log(
        '%cLoading Jolt Physics...',
        'color: yellow; font-weight: bold'
      );
    }

    // Step 2: Check worker status before loading
    T3DJoltLoader.checkWorkers();

    // Step 3: Initialize COI first if needed
    const coiEnabled = await T3DJoltLoader.initializeCOI({ quiet });

    if (!coiEnabled && !quiet) {
      console.warn(
        '⚠️ COI not enabled - multi-threading will be disabled. Workers may fail.'
      );
    }

    // Step 4: Load Jolt with enhanced options
    const result = await T3DJoltLoader.loadJolt({
      baseUrl,
      preferThreads: true,
      maxWorkerThreads,
      quiet,
      retryAttempts: T3DJoltLoaderConfig.retry.defaultAttempts,
      retryDelay: T3DJoltLoaderConfig.retry.defaultDelay,
    });

    // Step 5: Handle errors
    if (result.error) {
      console.error('❌ Failed to initialize Jolt Physics:', result.error);
      throw result.error;
    }

    if (!quiet) {
      console.log('Jolt', result.Jolt);
      console.log(
        `Jolt threaded? ${result.threaded}${result.workerCount ? ` (${result.workerCount} workers)` : ''}`
      );
    }

    // Step 6: Check worker status after loading
    if (result.threaded) {
      const finalStatus = T3DJoltLoader.checkWorkers();
      if (!quiet) {
        console.log(
          `[Workers] Multithreading enabled - ${finalStatus.workerCount} workers active`
        );
      }
    }

    // Step 7: Return the result
    return result;
  }
}
