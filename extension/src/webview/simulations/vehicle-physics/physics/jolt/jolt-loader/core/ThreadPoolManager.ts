/**
 * Thread Pool Manager
 * 
 * Auto-detects and configures optimal worker thread count based on CPU cores
 */

import { T3DJoltLoaderConfig } from '../T3DJoltLoaderConfig';

/**
 * Auto-detect optimal worker thread count based on CPU cores
 */
export function getOptimalWorkerThreadCount(
  requestedThreads?: number,
  maxThreads: number = T3DJoltLoaderConfig.threadPool.maxThreads
): number {
  if (requestedThreads !== undefined) {
    return Math.max(1, Math.min(maxThreads, requestedThreads));
  }

  // Auto-detect based on CPU cores
  if (
    typeof navigator !== 'undefined' &&
    'hardwareConcurrency' in navigator
  ) {
    const cores =
      navigator.hardwareConcurrency ||
      T3DJoltLoaderConfig.threadPool.defaultCores;
    // Use cores - 1 (leave one for main thread), but at least 1, max maxThreads
    const optimal = Math.max(1, Math.min(maxThreads, Math.max(1, cores - 1)));
    return optimal;
  }

  // Fallback: use defaultCores - 1 if hardware detection fails
  const fallbackCores = T3DJoltLoaderConfig.threadPool.defaultCores;
  return Math.max(1, Math.min(maxThreads, Math.max(1, fallbackCores - 1)));
}
