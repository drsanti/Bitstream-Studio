import { useState, useEffect, useRef, useCallback } from 'react';
import { T3DJoltLoader } from './T3DJoltLoader';
import { T3DJoltLoaderConfig } from './T3DJoltLoaderConfig';
import type { JoltModule } from './types';

/**
 * Options for the useJoltLoader hook
 */
export interface UseJoltLoaderOptions {
  /**
   * Base URL for Jolt WASM files.
   * @default Uses T3DJoltLoaderConfig.defaultBaseUrl
   */
  baseUrl?: string;

  /**
   * Maximum number of worker threads (1-16).
   * @default Uses T3DJoltLoaderConfig.threadPool.defaultMaxWorkerThreads
   */
  maxWorkerThreads?: number;

  /**
   * Suppress logging during initialization.
   * @default false
   */
  quiet?: boolean;

  /**
   * Automatically initialize Jolt on mount.
   * @default true
   */
  autoInitialize?: boolean;
}

/**
 * Return type for the useJoltLoader hook
 */
export interface UseJoltLoaderReturn {
  /** The loaded Jolt Physics module, or null if not loaded yet */
  Jolt: JoltModule | null;

  /** Whether initialization is currently in progress */
  isLoading: boolean;

  /** Any error that occurred during initialization, or null if no error */
  error: Error | null;

  /** Current loading progress message */
  infoMessage: string;

  /** Whether multi-threading is enabled */
  threaded: boolean;

  /** Number of worker threads used (undefined if single-threaded or not loaded) */
  workerCount: number | undefined;

  /** Time taken to load Jolt Physics in milliseconds */
  loadTime: number | undefined;

  /** Environment type where the application is running */
  environmentType: 'Browser' | 'Webview' | null;

  /** Manually initialize Jolt Physics */
  initialize: () => Promise<void>;

  /** Reload Jolt Physics (re-initialize) */
  reload: () => Promise<void>;
}

/**
 * Hook for loading and managing Jolt Physics with React state management.
 *
 * Handles:
 * - Automatic or manual initialization
 * - Loading state tracking
 * - Error handling
 * - Environment detection
 * - Config defaults integration
 * - React StrictMode protection
 *
 * @param options - Configuration options for Jolt initialization
 * @returns Object containing Jolt module, loading state, and control functions
 *
 * @example
 * ```tsx
 * const { Jolt, isLoading, error, initialize } = useJoltLoader({
 *   maxWorkerThreads: 5,
 *   autoInitialize: true,
 * });
 *
 * if (isLoading) return <div>Loading Jolt...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * if (Jolt) {
 *   // Use Jolt Physics
 * }
 * ```
 */
export const useJoltLoader = (
  options: UseJoltLoaderOptions = {}
): UseJoltLoaderReturn => {
  const {
    baseUrl = T3DJoltLoaderConfig.defaultBaseUrl,
    maxWorkerThreads = T3DJoltLoaderConfig.threadPool.defaultMaxWorkerThreads,
    quiet = false,
    autoInitialize = true,
  } = options;

  // State management
  const [Jolt, setJolt] = useState<JoltModule | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [infoMessage, setInfoMessage] = useState('');
  const [threaded, setThreaded] = useState(false);
  const [workerCount, setWorkerCount] = useState<number | undefined>(undefined);
  const [loadTime, setLoadTime] = useState<number | undefined>(undefined);
  const [environmentType, setEnvironmentType] = useState<
    'Browser' | 'Webview' | null
  >(null);

  // Refs for cleanup and preventing duplicate loads
  const isActiveRef = useRef(true);
  const initializationPromiseRef = useRef<Promise<void> | null>(null);
  const initializedRef = useRef(false);

  /**
   * Initialize Jolt Physics
   */
  const initialize = useCallback(async () => {
    // Prevent duplicate initialization in React StrictMode
    if (initializationPromiseRef.current) {
      return initializationPromiseRef.current;
    }

    // Prevent re-initialization if already initialized
    if (initializedRef.current && Jolt !== null) {
      return;
    }

    const initPromise = (async () => {
      isActiveRef.current = true;
      setIsLoading(true);
      setError(null);
      setInfoMessage('Initializing Jolt Physics...');

      try {
        // Initialize Jolt using T3DJoltLoader
        const result = await T3DJoltLoader.initializeJolt({
          baseUrl,
          maxWorkerThreads,
          quiet,
        });

        // Check if component is still mounted
        if (!isActiveRef.current) return;

        // Update state with results
        setJolt(result.Jolt);
        setThreaded(result.threaded);
        setWorkerCount(result.workerCount);
        setLoadTime(result.loadTime);

        // Get environment type
        const envType = T3DJoltLoader.getEnvironmentType();
        setEnvironmentType(envType);

        setInfoMessage(
          result.threaded
            ? `Jolt Physics loaded (${result.loadTime?.toFixed(0)}ms, ${result.workerCount} threads)`
            : `Jolt Physics loaded (${result.loadTime?.toFixed(0)}ms)`
        );

        initializedRef.current = true;
      } catch (err) {
        // Check if component is still mounted
        if (!isActiveRef.current) return;

        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setInfoMessage(`Failed to initialize Jolt Physics: ${error.message}`);
      } finally {
        if (isActiveRef.current) {
          setIsLoading(false);
        }
        initializationPromiseRef.current = null;
      }
    })();

    initializationPromiseRef.current = initPromise;
    return initPromise;
  }, [baseUrl, maxWorkerThreads, quiet, Jolt]);

  /**
   * Reload Jolt Physics (re-initialize)
   */
  const reload = useCallback(async () => {
    // Reset initialization state
    initializedRef.current = false;
    setJolt(null);
    setThreaded(false);
    setWorkerCount(undefined);
    setLoadTime(undefined);
    setError(null);

    // Re-initialize
    await initialize();
  }, [initialize]);

  // Auto-initialize on mount if enabled
  useEffect(() => {
    if (autoInitialize && !initializedRef.current) {
      initialize();
    }

    // Cleanup on unmount
    return () => {
      isActiveRef.current = false;
      initializationPromiseRef.current = null;
    };
  }, [autoInitialize, initialize]);

  return {
    Jolt,
    isLoading,
    error,
    infoMessage,
    threaded,
    workerCount,
    loadTime,
    environmentType,
    initialize,
    reload,
  };
};
