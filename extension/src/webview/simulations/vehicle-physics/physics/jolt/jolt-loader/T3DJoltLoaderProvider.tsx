import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useJoltLoader, type UseJoltLoaderOptions } from './useJoltLoader';
import type { JoltLoadResult } from './T3DJoltLoader';
import { JoltLoaderContext } from './useJoltLoaderContext';

/**
 * Props for T3DJoltLoaderProvider component
 */
export interface T3DJoltLoaderProviderProps extends UseJoltLoaderOptions {
  /** Child components that can access the Jolt loader context */
  children: ReactNode;

  /**
   * Callback invoked when Jolt Physics is successfully loaded
   */
  onLoaded?: (result: JoltLoadResult) => void;

  /**
   * Callback invoked when an error occurs during initialization
   */
  onError?: (error: Error) => void;
}

/**
 * Provider component that initializes Jolt Physics and provides context to children.
 *
 * Handles automatic initialization, state management, and provides the Jolt module
 * and loading state to all child components via context.
 *
 * @param props - Provider configuration options
 * @returns Provider component wrapping children
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <T3DJoltLoaderProvider
 *       maxWorkerThreads={5}
 *       onLoaded={(result) => console.log('Jolt loaded:', result)}
 *       onError={(error) => console.error('Jolt error:', error)}
 *     >
 *       <MyComponent />
 *     </T3DJoltLoaderProvider>
 *   );
 * }
 *
 * function MyComponent() {
 *   const { Jolt, isLoading } = useJoltLoaderContext();
 *   // Use Jolt Physics
 * }
 * ```
 */
export function T3DJoltLoaderProvider({
  children,
  baseUrl,
  maxWorkerThreads,
  quiet,
  autoInitialize,
  onLoaded,
  onError,
}: T3DJoltLoaderProviderProps) {
  const joltLoader = useJoltLoader({
    baseUrl,
    maxWorkerThreads,
    quiet,
    autoInitialize,
  });

  // Call onLoaded callback when Jolt is loaded
  useEffect(() => {
    if (
      joltLoader.Jolt &&
      !joltLoader.isLoading &&
      joltLoader.loadTime !== undefined
    ) {
      onLoaded?.({
        Jolt: joltLoader.Jolt,
        threaded: joltLoader.threaded,
        workerCount: joltLoader.workerCount,
        loadTime: joltLoader.loadTime,
      });
    }
  }, [
    joltLoader.Jolt,
    joltLoader.isLoading,
    joltLoader.loadTime,
    joltLoader.threaded,
    joltLoader.workerCount,
    onLoaded,
  ]);

  // Call onError callback when error occurs
  useEffect(() => {
    if (joltLoader.error) {
      onError?.(joltLoader.error);
    }
  }, [joltLoader.error, onError]);

  return (
    <JoltLoaderContext.Provider value={joltLoader}>
      {children}
    </JoltLoaderContext.Provider>
  );
}
