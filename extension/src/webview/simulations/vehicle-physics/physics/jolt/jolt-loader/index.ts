/**
 * Physics-Jolt Loader
 *
 * Enhanced Jolt Physics loader with improved error handling, configuration, and monitoring
 * Supports both single-threaded and multi-threaded Jolt Physics builds
 */

// Export the main class
export { T3DJoltLoader } from './T3DJoltLoader';

// Export configuration
export { T3DJoltLoaderConfig } from './T3DJoltLoaderConfig';

// Export React hook
export {
  useJoltLoader,
  type UseJoltLoaderOptions,
  type UseJoltLoaderReturn,
} from './useJoltLoader';

// Export React provider component
export {
  T3DJoltLoaderProvider,
  type T3DJoltLoaderProviderProps,
} from './T3DJoltLoaderProvider';

// Export React context hook
export { useJoltLoaderContext } from './useJoltLoaderContext';

// Export all types
export type * from './T3DJoltLoader';

// Type alias for backward compatibility - note: cannot be used as namespace with dot notation
// For namespace-style access (initJolt.JoltInterface), import Jolt namespace directly from jolt-physics
import type { JoltModule } from './types';
export type initJolt = JoltModule;
