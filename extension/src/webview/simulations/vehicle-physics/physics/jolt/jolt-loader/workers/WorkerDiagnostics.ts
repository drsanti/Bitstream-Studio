/**
 * Worker Diagnostics
 * 
 * Provides worker status checking and testing utilities
 */

import { initialize, getWorkerCreationCount, isPatched } from './WorkerManager';

/**
 * Check if WASM threads can be used (requires COI)
 */
export function canUseWasmThreads(): boolean {
  return (
    typeof SharedArrayBuffer !== 'undefined' &&
    typeof Atomics !== 'undefined' &&
    (globalThis as any).crossOriginIsolated === true
  );
}

/**
 * Enhanced worker status check with detailed information
 */
export function checkWorkers(): {
  workerAvailable: boolean;
  isPatched: boolean;
  workerCount: number;
  serviceWorkerAvailable: boolean;
  coiReady: boolean;
} {
  initialize();

  if (typeof window === 'undefined') {
    return {
      workerAvailable: false,
      isPatched: false,
      workerCount: 0,
      serviceWorkerAvailable: false,
      coiReady: false,
    };
  }

  const status = {
    workerAvailable: typeof Worker !== 'undefined',
    isPatched: isPatched(),
    workerCount: getWorkerCreationCount(),
    serviceWorkerAvailable:
      typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
    coiReady: canUseWasmThreads(),
  };

  console.log('[Workers] Status:', status);

  return status;
}

/**
 * Test worker creation with error handling
 */
export function testWorkerCreation(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof Worker === 'undefined') {
      console.error('[Test] Workers not supported in this environment');
      resolve(false);
      return;
    }

    // Create a simple test worker
    const testCode = `self.postMessage({ type: 'test', message: 'Worker created successfully' });`;
    const blob = new Blob([testCode], { type: 'text/javascript' });
    const blobUrl = URL.createObjectURL(blob);

    try {
      const worker = new Worker(blobUrl, { type: 'classic' });
      console.log('[Test] ✅ Test worker created successfully');

      const timeout = setTimeout(() => {
        worker.terminate();
        URL.revokeObjectURL(blobUrl);
        console.error('[Test] ❌ Worker test timeout');
        resolve(false);
      }, 5000);

      worker.onmessage = (e) => {
        clearTimeout(timeout);
        console.log('[Test] ✅ Worker message received:', e.data);
        worker.terminate();
        URL.revokeObjectURL(blobUrl);
        resolve(true);
      };

      worker.onerror = (e) => {
        clearTimeout(timeout);
        console.error('[Test] ❌ Worker error:', e);
        URL.revokeObjectURL(blobUrl);
        resolve(false);
      };
    } catch (error) {
      console.error('[Test] ❌ Failed to create test worker:', error);
      URL.revokeObjectURL(blobUrl);
      resolve(false);
    }
  });
}
