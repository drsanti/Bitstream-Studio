/**
 * Configuration constants for T3DJoltLoader
 */
export const T3DJoltLoaderConfig = {
  /**
   * File paths configuration
   */
  /**
   * Default base URL for Jolt Physics WASM files.
   * Used when baseUrl is not provided in options.
   */
  defaultBaseUrl: '/jolt',
  /**
   * Default path to the COI (Cross-Origin Isolation) service worker file.
   * Required for enabling SharedArrayBuffer support in multi-threaded builds.
   */
  defaultServiceWorkerPath: '/t3d-coi-serviceworker.js',

  /**
   * Thread pool configuration
   */
  threadPool: {
    /**
     * Fallback number of CPU cores when hardwareConcurrency is not available.
     * Used in auto-detection logic: optimal threads = cores - 1
     */
    defaultCores: 4,
    /**
     * Maximum number of worker threads allowed (1-16).
     * Used to clamp thread count values.
     */
    maxThreads: 16,
    /**
     * Default max worker threads when user doesn't specify maxWorkerThreads.
     * If set, this overrides auto-detection and uses the specified value directly.
     */
    defaultMaxWorkerThreads: 5,
  },

  /**
   * Worker logging configuration
   */
  /**
   * Interval in milliseconds for logging worker creation summaries.
   * Reduces verbose logging by batching worker creation messages.
   */
  workerLogInterval: 1000,

  /**
   * Retry configuration
   */
  retry: {
    /**
     * Default number of retry attempts for failed operations.
     * Used for COI initialization and general retry logic.
     */
    defaultAttempts: 2,
    /**
     * Default delay in milliseconds between retry attempts.
     */
    defaultDelay: 500,
    /**
     * Number of retry attempts for module factory loading.
     * Set to 0 to disable retries (fail fast on module load errors).
     */
    loadModuleAttempts: 0,
  },

  /**
   * COI (Cross-Origin Isolation) configuration
   */
  coi: {
    /**
     * Maximum wait time in milliseconds for COI initialization to complete.
     * If COI is not ready within this time, initialization will fail or fall back.
     */
    defaultMaxWaitTime: 10000,
    /**
     * Interval in milliseconds for checking COI readiness status.
     * Used during COI initialization polling.
     */
    checkInterval: 50,
  },
} as const;
