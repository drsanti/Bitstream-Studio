/**
 * Worker Manager
 * 
 * Handles Worker constructor patching, worker creation tracking, and cleanup
 */

import { T3DJoltLoaderConfig } from '../T3DJoltLoaderConfig';

/**
 * Worker manager state
 */
class WorkerManagerState {
  // Store original Worker constructor for patch detection
  originalWorkerConstructor: typeof Worker | null = null;

  // Worker creation counter for reduced logging
  workerCreationCount = 0;
  lastWorkerLogTime = 0;
}

const state = new WorkerManagerState();

/**
 * Initialize Worker patching and cleanup handlers
 * Called automatically when class is first used
 */
export function initialize(): void {
  // Step 1: Check if already initialized
  if (state.originalWorkerConstructor !== null) {
    return; // Already initialized
  }

  // Step 2: Patch Worker constructor to log worker creation (with reduced verbosity)
  if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
    // Step 2.1: Store original Worker constructor
    state.originalWorkerConstructor = window.Worker;

    // Step 2.2: Store on window for debugging
    (window as any).__OriginalWorker = state.originalWorkerConstructor;

    // Step 2.3: Create patched Worker class
    const OriginalWorker = state.originalWorkerConstructor;
    window.Worker = class PatchedWorker extends OriginalWorker {
      constructor(scriptURL: string | URL, options?: WorkerOptions) {
        super(scriptURL, options);

        // Step 2.3.1: Increment worker creation counter
        state.workerCreationCount++;
        const now = Date.now();

        // Step 2.3.2: Log summary every WORKER_LOG_INTERVAL or on first worker
        const logInterval = T3DJoltLoaderConfig.workerLogInterval;
        if (
          state.workerCreationCount === 1 ||
          now - state.lastWorkerLogTime >= logInterval
        ) {
          if (state.workerCreationCount === 1) {
            console.log(
              `[Worker] Creating workers (type: ${options?.type || 'classic'})...`
            );
          } else if (now - state.lastWorkerLogTime >= logInterval) {
            console.log(
              `[Worker] Created ${state.workerCreationCount} workers so far...`
            );
          }

          state.lastWorkerLogTime = now;
        }
      }
    };

    console.log('[Worker] ✅ Worker constructor patched');
  }

  // Step 3: Register cleanup handler for worker counter reset on page unload
  // Note: Blob URLs are cleaned up immediately after use in loadModuleFactory(),
  // so no persistent blob URL tracking is needed
  if (typeof window !== 'undefined') {
    const cleanup = () => {
      // Reset worker creation counter on page unload/refresh
      state.workerCreationCount = 0;
    };
    window.addEventListener('beforeunload', cleanup);
    window.addEventListener('pagehide', cleanup);
  }
}

/**
 * Get the current worker creation count
 */
export function getWorkerCreationCount(): number {
  return state.workerCreationCount;
}

/**
 * Reset worker creation count (useful for tracking workers created during Jolt init)
 */
export function resetWorkerCreationCount(): void {
  state.workerCreationCount = 0;
}

/**
 * Manual cleanup function (useful for HMR/dev scenarios)
 * Resets worker creation counter since blob URLs are cleaned up immediately after use
 */
export function disposeJoltLoaderBlobs(): void {
  // Reset worker creation counter
  // Note: Blob URLs are cleaned up immediately in loadModuleFactory(), so no tracking needed
  state.workerCreationCount = 0;
}

/**
 * Restore the original Worker constructor (undo patching)
 * Useful for compatibility with other libraries that need the original Worker
 */
export function restoreWorkerConstructor(): void {
  if (state.originalWorkerConstructor && typeof window !== 'undefined') {
    window.Worker = state.originalWorkerConstructor;
    state.originalWorkerConstructor = null;
    if (typeof (window as any).__OriginalWorker !== 'undefined') {
      delete (window as any).__OriginalWorker;
    }
  }
}

/**
 * Check if Worker constructor is patched
 */
export function isPatched(): boolean {
  return (
    state.originalWorkerConstructor !== null &&
    typeof window !== 'undefined' &&
    window.Worker !== state.originalWorkerConstructor
  );
}

/**
 * Get the original Worker constructor
 */
export function getOriginalWorkerConstructor(): typeof Worker | null {
  return state.originalWorkerConstructor;
}
