/**
 * Jolt Module Loader
 * 
 * Core Jolt Physics loading logic (multi-threaded and single-threaded)
 */

import type { JoltModule } from '../types';
import { T3DJoltLoaderConfig } from '../T3DJoltLoaderConfig';
import { loadModuleFactory, type EmscriptenModuleOptions } from './ModuleLoader';
import { getOptimalWorkerThreadCount } from './ThreadPoolManager';
import { initialize, getWorkerCreationCount, resetWorkerCreationCount } from '../workers/WorkerManager';
import { canUseWasmThreads } from '../workers/WorkerDiagnostics';

/**
 * Configuration options for Jolt Physics loading
 */
export interface JoltLoadOptions {
  baseUrl: string;
  resolveUrl?: (filename: string) => string; // Optional: explicit URL resolution callback
  preferThreads?: boolean;
  maxWorkerThreads?: number; // 1-16, auto-detected if not provided
  quiet?: boolean;
  retryAttempts?: number; // Number of retry attempts for failed loads
  retryDelay?: number; // Delay between retries in ms
}

/**
 * Result of Jolt Physics loading
 */
export interface JoltLoadResult {
  Jolt: JoltModule | null; // null when error occurs
  threaded: boolean;
  workerCount?: number;
  loadTime?: number;
  error?: Error;
}

/**
 * Jolt loader state
 */
class JoltLoaderState {
  // Store the worker thread count from the last successful Jolt load
  lastWorkerThreadCount: number | undefined = undefined;

  // Store the Jolt module from the last successful load
  lastJoltModule: JoltModule | undefined = undefined;
}

const state = new JoltLoaderState();

/**
 * Get the worker thread count from the last successful Jolt load
 * @returns The worker thread count, or undefined if Jolt hasn't been loaded yet
 */
export function getWorkerThreadCount(): number | undefined {
  return state.lastWorkerThreadCount;
}

/**
 * Get the Jolt module from the last successful load
 * @returns The Jolt module, or undefined if Jolt hasn't been loaded yet
 */
export function getJolt(): JoltModule | undefined {
  return state.lastJoltModule;
}

/**
 * Load Jolt Physics with enhanced error handling and configuration
 */
export async function loadJolt(options: JoltLoadOptions): Promise<JoltLoadResult> {
  // Step 1: Ensure initialization
  initialize();

  // Step 1.1: Start timing the load process
  const startTime = performance.now();

  // Step 2: Clean up any existing blob URLs before loading (important for HMR/dev scenarios)
  resetWorkerCreationCount();

  // Step 3: Extract options with defaults
  const {
    baseUrl,
    resolveUrl,
    preferThreads = true,
    maxWorkerThreads,
    quiet = false,
    retryAttempts = T3DJoltLoaderConfig.retry.defaultAttempts,
    retryDelay = T3DJoltLoaderConfig.retry.defaultDelay,
  } = options;

  // Helper function to resolve URLs (use callback if provided, otherwise concatenate)
  const resolveUrlHelper = (filename: string): string => {
    if (resolveUrl) {
      return resolveUrl(filename);
    }
    return `${baseUrl}/${filename}`;
  };

  try {
    // Step 4: Determine if we should use multi-threading
    const useThreads = preferThreads && canUseWasmThreads();

    if (useThreads) {
      // Step 5: Multi-threaded loading path
      // Step 5.1: Construct URLs for multi-threaded build
      const glueUrl = resolveUrlHelper('jolt-physics.multithread.wasm.js');
      const wasmUrl = resolveUrlHelper('jolt-physics.multithread.wasm.wasm');

      if (!quiet) {
        console.log('📦 Loading multi-threaded Jolt Physics...');
      }

      // Step 5.2: Load glue as ES module using dynamic import (required for import.meta support)
      const factory = await loadModuleFactory(
        glueUrl,
        retryAttempts,
        retryDelay
      );

      // Step 5.3: Convert to absolute URL for workers
      // For ESM glue files (containing import.meta), we pass the glue URL directly
      // Emscripten will create module workers that can load ESM modules
      const absoluteGlueUrl =
        typeof window !== 'undefined'
          ? new URL(glueUrl, window.location.origin).href
          : glueUrl;

      // Step 5.4: Configure thread pool if maxWorkerThreads is provided
      const optimalThreads = getOptimalWorkerThreadCount(maxWorkerThreads);

      // Step 5.5: Reset worker counter to only count workers created during Jolt initialization
      const workerCountBeforeJolt = getWorkerCreationCount();

      if (!quiet && optimalThreads > 1) {
        console.log(
          `⚙️ Configuring thread pool: requesting ${optimalThreads} worker thread${optimalThreads !== 1 ? 's' : ''}`
        );
      }

      // Step 5.6: Try to set PThread pool size BEFORE loading factory (if PThread exists)
      // Some Emscripten builds check this before creating workers
      if (optimalThreads > 1) {
        try {
          // Step 5.6.1: Check if PThread is already available (from a previous load)
          if (typeof (window as any).PThread !== 'undefined') {
            (window as any).PThread.pthreadPoolSize = optimalThreads;
            if (!quiet) {
              console.log(
                `⚙️ Set PThread.pthreadPoolSize = ${optimalThreads} (before factory)`
              );
            }
          }
        } catch {
          // Ignore - PThread might not be available yet
        }
      }

      // Step 5.7: Create Emscripten module initialization options
      const initOptions: EmscriptenModuleOptions = {
        locateFile: (p: string) => (p.endsWith('.wasm') ? wasmUrl : p),
        mainScriptUrlOrBlob: absoluteGlueUrl,
        // Pass pthreadPoolSize in initOptions - Emscripten will use this if supported
        // Note: If the WASM was compiled with PTHREAD_POOL_SIZE, this may be ignored
        pthreadPoolSize: optimalThreads,
      };

      // Step 5.8: Initialize the Jolt module with the factory
      const Jolt = await factory(initOptions);

      // Step 5.9: Calculate actual physics thread pool workers (exclude any pre-existing workers)
      const physicsWorkerCount = getWorkerCreationCount() - workerCountBeforeJolt;

      // Step 5.10: Try to get the actual thread pool size from Emscripten after initialization
      let actualWorkerCount = optimalThreads; // Default to requested value
      try {
        // Step 5.10.1: Check PThread.pthreadPoolSize (most reliable source)
        if (typeof (window as any).PThread !== 'undefined') {
          const pThreadPoolSize = (window as any).PThread.pthreadPoolSize;
          if (pThreadPoolSize && pThreadPoolSize > 0) {
            actualWorkerCount = pThreadPoolSize;
            if (!quiet) {
              console.log(
                `ℹ️ Emscripten PThread.pthreadPoolSize = ${pThreadPoolSize}`
              );
            }
          }
        }
        // Step 5.10.2: Alternative: Check Module.pthreadPoolSize
        if (Jolt && typeof (Jolt as any).pthreadPoolSize === 'number') {
          actualWorkerCount = (Jolt as any).pthreadPoolSize;
          if (!quiet) {
            console.log(
              `ℹ️ Jolt module pthreadPoolSize = ${actualWorkerCount}`
            );
          }
        }
      } catch {
        // Fall through - use worker count or requested value
      }

      // Step 5.11: If we couldn't get it from Emscripten, use the worker creation count as fallback
      if (
        actualWorkerCount === optimalThreads &&
        physicsWorkerCount > 0 &&
        physicsWorkerCount !== optimalThreads
      ) {
        // If worker count differs from requested, trust the actual count
        actualWorkerCount = physicsWorkerCount;
        if (!quiet) {
          console.log(
            `ℹ️ Using worker creation count as thread pool size: ${actualWorkerCount}`
          );
        }
      }

      if (!quiet) {
        console.log(
          `ℹ️ Worker creation: ${workerCountBeforeJolt} before → ${getWorkerCreationCount()} after (${physicsWorkerCount} created during Jolt init)`
        );
      }

      // Step 5.12: Calculate load time
      const loadTime = performance.now() - startTime;

      if (!quiet) {
        console.log(
          `✅ Multi-threaded Jolt Physics loaded (${loadTime.toFixed(0)}ms, ${actualWorkerCount} worker thread${actualWorkerCount !== 1 ? 's' : ''})`
        );
        // Only warn if the difference is significant (more than 1 thread)
        // Small differences (±1) are common due to Emscripten defaults and are harmless
        const threadDifference = Math.abs(optimalThreads - actualWorkerCount);
        if (threadDifference > 1 && actualWorkerCount > 0) {
          console.warn(
            `⚠️ Requested ${optimalThreads} thread${optimalThreads !== 1 ? 's' : ''}, but ${actualWorkerCount} ${actualWorkerCount !== 1 ? 'were' : 'was'} created. This may be due to Emscripten defaults or system limitations.`
          );
        } else if (threadDifference === 1 && !quiet) {
          // Log as info (not warning) for small differences
          console.log(
            `ℹ️ Requested ${optimalThreads} thread${optimalThreads !== 1 ? 's' : ''}, but ${actualWorkerCount} ${actualWorkerCount !== 1 ? 'were' : 'was'} created (Emscripten default).`
          );
        }
      }

      // Step 5.13: Store the worker thread count and Jolt module for later retrieval
      state.lastWorkerThreadCount = actualWorkerCount;
      state.lastJoltModule = Jolt;

      return {
        Jolt,
        threaded: true,
        workerCount: actualWorkerCount,
        loadTime,
      };
    } else {
      // Step 6: Single-threaded loading path
      // Step 6.1: Construct URLs for single-threaded build
      const glueUrl = resolveUrlHelper('jolt-physics.wasm.js');
      const wasmUrl = resolveUrlHelper('jolt-physics.wasm.wasm');

      if (!quiet) {
        console.log('📦 Loading single-threaded Jolt Physics...');
      }

      // Step 6.2: Single-thread version also uses import.meta, must load as ES module
      const factory = await loadModuleFactory(
        glueUrl,
        retryAttempts,
        retryDelay
      );

      // Step 6.3: Initialize the Jolt module
      const Jolt = await factory({
        locateFile: (p: string) => (p.endsWith('.wasm') ? wasmUrl : p),
      });

      // Step 6.4: Calculate load time
      const loadTime = performance.now() - startTime;

      if (!quiet) {
        console.log(
          `✅ Single-threaded Jolt Physics loaded (${loadTime.toFixed(0)}ms)`
        );
      }

      // Step 6.5: Store 0 for single-threaded loads and Jolt module
      state.lastWorkerThreadCount = 0;
      state.lastJoltModule = Jolt;

      return {
        Jolt,
        threaded: false,
        loadTime,
      };
    }
  } catch (error) {
    // Step 7: Error handling
    const loadTime = performance.now() - startTime;
    const err = error instanceof Error ? error : new Error(String(error));

    if (!quiet) {
      console.error(
        `❌ Failed to load Jolt Physics (${loadTime.toFixed(0)}ms):`,
        err
      );
    }

    // Step 7.1: Return error in result instead of throwing (graceful degradation)
    return {
      Jolt: null,
      threaded: false,
      loadTime,
      error: err,
    };
  }
}
