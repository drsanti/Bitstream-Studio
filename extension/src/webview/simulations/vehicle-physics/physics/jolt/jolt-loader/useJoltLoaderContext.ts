import { createContext, useContext } from 'react';
import type { UseJoltLoaderReturn } from './useJoltLoader';

/**
 * Context for Jolt Loader
 */
export const JoltLoaderContext = createContext<UseJoltLoaderReturn | null>(
  null
);

/**
 * Hook to access Jolt Loader context.
 *
 * Must be used within a T3DJoltLoaderProvider component.
 *
 * @returns Jolt loader context value
 * @throws Error if used outside T3DJoltLoaderProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { Jolt, isLoading, error } = useJoltLoaderContext();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!Jolt) return null;
 *
 *   // Use Jolt Physics
 *   return <div>Jolt loaded!</div>;
 * }
 * ```
 */
export function useJoltLoaderContext(): UseJoltLoaderReturn {
  const context = useContext(JoltLoaderContext);
  if (!context) {
    throw new Error(
      'useJoltLoaderContext must be used within a T3DJoltLoaderProvider'
    );
  }
  return context;
}
