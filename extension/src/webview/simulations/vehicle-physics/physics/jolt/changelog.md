# physics-jolt

## Features added

## Changelog

### Version 0.0.1

#### [Latest] - Cache Router Organization and Renaming - 2025-01-15

#### Refactoring

- **T3DCacheRouter Moved and Renamed**: Moved cache router from `cache/` to `coi/` directory and renamed to `T3DCacheRouter`
  - Better cohesion: Cache router is now grouped with COI functionality
  - Only used by `T3DCOIServiceWorker`, so location in `coi/` makes more sense
  - Renamed class from `ServiceWorkerCacheRouter` to `T3DCacheRouter` to match file name and T3D naming conventions
  - Updated imports in `T3DCOIServiceWorker.ts` to use local import
  - Added export to `coi/index.ts` for external access if needed

#### Files Moved/Renamed

- `src/T3D/cache/ServiceWorkerCacheRouter.ts` → `src/T3D/physics-jolt/coi/T3DCacheRouter.ts`

#### Files Modified

- `src/T3D/physics-jolt/coi/T3DCacheRouter.ts` - Renamed class to `T3DCacheRouter`
- `src/T3D/physics-jolt/coi/T3DCOIServiceWorker.ts` - Updated to use `T3DCacheRouter`
- `src/T3D/physics-jolt/coi/index.ts` - Updated exports for `T3DCacheRouter` and types
- `src/T3D/physics-jolt/coi/docs/03-architecture.md` - Updated architecture documentation

#### Benefits

- **Better Organization**: Cache router utilities grouped with COI functionality
- **Improved Cohesion**: Related functionality is now in the same directory
- **Consistent Naming**: Class name matches file name and follows T3D naming conventions (`T3D*`)
- **Clearer Dependencies**: Makes it obvious that T3DCacheRouter is COI-specific

#### [Previous] - Service Worker Cache Optimization for WASM Loading Performance

#### Performance Optimization

- **Service Worker Cache-First Strategy**: Implemented cache-first strategy in COI service worker to reduce redundant network requests
  - Service worker now checks Cache API before making network requests
  - Cached responses (with COI headers) are returned immediately without network round-trips
  - Reduces duplicate requests from 15+ to 1-3 per resource type
  - Significantly improves subsequent page load times
- **WASM Loading Performance Monitoring**: Improved performance warning thresholds
  - Increased warning threshold from 5s to 10s (production builds typically load in 2-4s)
  - Enhanced warning messages with actionable debugging guidance
  - Only warns on genuinely slow loads (>10s)
- **Files Modified**:
  - `src/T3D/physics-jolt/coi/T3DCOIServiceWorker.ts` - Added cache-first fetch handler
  - `public/t3d-coi-serviceworker.js` - Updated public service worker
  - `apps/next-app/public/t3d-coi-serviceworker.js` - Updated Next.js service worker
  - `src/T3D/physics-jolt/T3DPhysics.ts` - Updated performance warning threshold
- **Documentation**: Added comprehensive documentation in `docs/SERVICE-WORKER-OPTIMIZATION.md`

#### Benefits

- **Faster Load Times**: Subsequent page loads use cached resources (near-instant)
- **Reduced Network Overhead**: Eliminates redundant requests for worker files, client, and env.mjs
- **Better Performance Monitoring**: More accurate warnings for genuinely slow loads
- **Improved User Experience**: Cleaner Network tab, faster initialization

#### [Previous] - Consolidated Jolt/COI/Worker Functionality into T3DJolt Class

#### Refactoring

- **T3DJolt Class**: Created new `T3DJolt` class that consolidates all Jolt Physics, COI, and multithread worker functionality
  - Moved `initializeCOI()` static method from `T3DEngine` to `T3DJolt`
  - Moved `initializePhysics()`, `buildDynamicObjectsFromModel()`, `getPhysics()`, `disposePhysics()`, and `cleanupPhysicsBuilder()` from `T3DEngine` to `T3DJolt`
  - All physics-related functionality is now centralized in one class for better code organization
  - `T3DEngine` now has a `getJolt()` method that returns the `T3DJolt` instance
- **API Changes**:
  - `T3D.initializeCOI()` → `T3DJolt.initializeCOI()` (static method)
  - `engine.initializePhysics()` → `engine.getJolt()?.initializePhysics()`
  - `engine.getPhysics()` → `engine.getJolt()?.getPhysics()`
  - `engine.buildDynamicObjectsFromModel()` → `engine.getJolt()?.buildDynamicObjectsFromModel()`
  - `engine.disposePhysics()` → `engine.getJolt()?.disposePhysics()`
  - `engine.cleanupPhysicsBuilder()` → `engine.getJolt()?.cleanupPhysicsBuilder()`
- **T3DCOIManager Updates**: Updated `waitForPhysicsReady()` to use `engine.getJolt()?.getPhysics()` instead of `engine.getPhysics()`
- **Documentation Updates**: Updated all documentation to reflect the new T3DJolt API
  - Updated `PHYSICS-INITIALIZATION.md` with new API examples
  - Updated `COI-INITIALIZATION-FLOW.md` sequence diagrams to show T3DJolt usage
- **Usage Sites Updated**: Updated all application files and examples to use the new API pattern

#### Benefits

- **Better Organization**: All Jolt/COI/worker code is now in one place (`T3DJolt` class)
- **Clearer API**: `T3DJolt.initializeCOI()` is more intuitive than `T3D.initializeCOI()`
- **Easier Maintenance**: Single class to manage physics-related functionality
- **Better Separation of Concerns**: Engine focuses on graphics, T3DJolt handles physics
- **Type Safety**: Clearer types and interfaces

#### Migration Guide

To migrate existing code:

1. Replace `T3D.initializeCOI()` with `T3DJolt.initializeCOI()` in your entry point
2. Replace `engine.initializePhysics()` with `engine.getJolt()?.initializePhysics()`
3. Replace `engine.getPhysics()` with `engine.getJolt()?.getPhysics()`
4. Replace `engine.buildDynamicObjectsFromModel()` with `engine.getJolt()?.buildDynamicObjectsFromModel()`
5. Replace `engine.disposePhysics()` with `engine.getJolt()?.disposePhysics()`
6. Replace `engine.cleanupPhysicsBuilder()` with `engine.getJolt()?.cleanupPhysicsBuilder()`

#### [Previous] - Simplified Debug Mesh to Use Simple Wireframe Material

#### Refactoring

- **Simplified Debug Mesh Rendering**: Reverted from complex LineMaterial/Line2 approach back to simple wireframe materials
  - Removed `T3DDebugMaterial` class and all LineMaterial/Line2/LineGeometry dependencies
  - Restored `getDebugMeshMaterial()` method to use `wireframe: true` on `MeshStandardMaterial` or `MeshNormalMaterial`
  - All debug meshes now use simple `THREE.Mesh` objects with wireframe materials
  - Much simpler and more reliable implementation
  - Works correctly for all shape types including compound shapes
- **Removed Complex Geometry Conversion**: Removed `convertGeometryToLineGeometry()` method
  - No longer needed with simple wireframe materials
  - Wireframe rendering is handled automatically by Three.js material system
- **Removed Compound Shape Special Handling**: Removed `createCompoundShapeDebugMesh()` method
  - Compound shapes now use the default path with `createMeshForShape()` and simple wireframe material
  - Simple wireframe materials work correctly for compound shapes without special handling
- **Simplified Configuration**: Removed `wireframeLineWidth` option from `T3DPhysicsOptions` and `PhysicsOptions`
  - No longer needed with simple wireframe materials
  - Wireframe line width is controlled by Three.js material system (typically 1 pixel in WebGL)
- **Simplified Disposal**: Removed Line2 and LineGeometry disposal code
  - Only handles `THREE.Mesh` objects now
  - Simpler and cleaner disposal logic

#### Technical Details

- Simple wireframe materials (`wireframe: true`) work reliably for all shape types
- No need for complex geometry conversion or sub-shape iteration
- `wireframe: true` on materials automatically handles all edge rendering
- Performance is good enough for debug visualization
- Much simpler codebase to maintain

#### [Previous] - API Refactoring, Memory Management, and Documentation

#### New Features

- **COI Assets Overview**: Added `COI-ASSET-FLOW.md` describing how `T3DCOILoader`, `T3DCOIServiceWorker`, and `public/t3d-coi-serviceworker.js` cooperate to deliver COI-enabled physics
  - Includes responsibilities for each file and a Mermaid sequence diagram of the registration flow
  - Clarifies update and maintenance steps when the worker script changes
- **Shape Type Unwrapping**: Added `getShapeType()` method that automatically unwraps decorated shapes (ScaledShape, RotatedTranslated, OffsetCenterOfMass) to get the actual inner shape type
  - Method accepts both `Shape` and `Body` objects for flexibility
  - Recursively unwraps nested decorated shapes
  - Resolves shape type determination issues when shapes are wrapped
- **Comprehensive Architecture Documentation**: Created `ARCHITECTURE.md` with detailed Mermaid diagrams explaining:
  - System architecture and component relationships
  - Initialization flow with sequence diagrams
  - Object creation workflow from shape to scene
  - Memory management patterns and reference counting
  - Update loop and sub-stepping mechanics
  - Cleanup processes
  - Complete examples with best practices
- **Crossoriginworker documentation**: Expanded `ARCHITECTURE.md` and `info.md` to cover the VS Code webview path that uses `crossoriginworker` (ArrayBuffer copies) when COI/SharedArrayBuffer is unavailable, including performance trade-offs and single-thread fallback behavior

#### Bug Fixes

- **Fixed floor penetration issue**: Removed scaling logic from `addRandomObjectToScene()` that was causing spheres and cylinders to sink through the floor
  - Removed commented-out `ScaledShape` wrapping code that caused visual/physics mismatch
  - Objects now use their actual shape dimensions directly, ensuring proper collision with the floor
  - Updated cleanup comments to reflect direct shape usage instead of wrapped shapes
- **Fixed floor convex radius**: Changed floor `BoxShape` convex radius from `0.05` to `0.0` in `createFloor()` method
  - Static floors don't need rounded edges, which were causing slight penetration
  - Zero convex radius ensures flat, accurate collision surface at y=0
  - Prevents objects from sinking partially into the floor surface
- **Fixed NaN values causing computeBoundingSphere errors**: Added comprehensive validation to prevent NaN values in geometry creation and mesh updates
  - **Geometry creation validation**: All debug mesh geometries now validate dimensions before creation
    - `SphereGeometry`: Validates radius, uses default 0.5 if invalid
    - `BoxGeometry`: Validates extent (x, y, z), uses default 1.0 if invalid
    - `CapsuleGeometry`: Validates radius and height, uses defaults if invalid
    - `CylinderGeometry`: Validates radius and height, uses defaults if invalid
  - **Position and rotation validation**: Body positions and rotations are validated before applying to meshes
    - `createDebugMeshForBody()`: Validates position and rotation when creating debug meshes
    - `update()`: Validates position and rotation in the update loop, skips update if invalid (prevents NaN propagation)
  - **Triangle vertex sanitization**: `createMeshForShape()` now sanitizes NaN values in triangle vertices
    - Replaces NaN values with 0 and logs warnings
    - Wraps `computeVertexNormals()` in try-catch to handle edge cases gracefully
  - Prevents "THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN" errors
  - Invalid values are replaced with safe defaults with console warnings for debugging
- **Fixed memory leaks in object creation**: Added proper cleanup for temporary Jolt objects in:
  - `createFloor()`: Now destroys Vec3, RVec3, and Quat objects after use
  - `createMeshFloor()`: Now destroys RVec3 and Quat objects after use
  - `addRandomObjectToScene()`: Added cleanup for Vec3 objects in Box, ConvexHull, StaticCompound, MutableCompound, and OffsetCenterOfMass shape creation
  - `SetGravity()`: Now destroys gravity Vec3 after setting
- **Fixed incorrect colors for wrapped shapes**: Resolved issue where all physics objects appeared green due to wrapped shapes (e.g., `ScaledShape`) returning wrapper shape type instead of original shape type
  - `getShapeType()` automatically unwraps decorated shapes to get actual type
  - `addToScene()` now uses `getShapeType()` when shapeType is not provided
  - Ensures correct color mapping based on actual shape type (Sphere, Box, etc.) rather than wrapper type

#### Refactoring

- **Refactored `addToScene()` API**: Changed from positional parameters to object parameter for better extensibility
  - Old: `addToScene(body: initJolt.Body, shapeType?: number)`
  - New: `addToScene({ body, shapeType? }: { body: initJolt.Body, shapeType?: number })`
  - All callers updated to use object syntax
  - More flexible and future-proof API design
- **Enhanced `T3DDynamicObject` interface**: Added `shapeType: number` property to store shape type directly on the object
  - Enables access to shape type without querying the body's shape
  - Prevents loss of shape type information for wrapped shapes
  - Improves data integrity and accessibility
- **Method renames for clarity**:
  - `generateObject()` → `addRandomObjectToScene()`: Better describes the method's purpose
  - `getDynamicObjectsAsThreeObjects()` → `getDebugMeshes()`: Clearer, more concise name
- **Extracted material creation logic**: Created `getDebugMeshMaterial()` method to centralize material creation and caching
  - Moved material creation logic from `getThreeObjectForBody()` to dedicated method
  - Method takes `shapeType` parameter directly instead of extracting from shape
  - Simplifies code organization and improves maintainability
  - Uses `getDebugMeshColor()` to determine color based on shape type
- **Updated `createDebugMeshForBody()` signature**: Changed to accept `shapeType` as required second parameter
  - Method signature: `createDebugMeshForBody(body: initJolt.Body, shapeType: number)`
  - Shape type must be provided by caller, ensuring correct type is used even for wrapped shapes
  - Removed dependency on `shape.GetSubType()` which can return incorrect type for wrapped shapes

#### [Previous] - Application Initialization Refactoring

#### New Features

- **Static `initializeApp` method**: Added `T3DEngine.initializeApp()` static method to handle application initialization
  - Automatically handles Cross-Origin Isolation (COI) setup for multi-threaded Jolt Physics
  - Manages COI service worker registration and SharedArrayBuffer availability checks
  - Calls provided callback with a new `T3DEngine` instance after COI is ready
  - Usage: `T3D.initializeApp((engine) => { /* your app setup */ })`
  - Simplifies application bootstrap by centralizing COI initialization logic

#### Refactoring

- **Moved initialization logic to T3DEngine**: Refactored `initializeApp` from `main.tsx` to a static method in `T3DEngine.ts`
  - COI initialization code now lives in the engine class for better organization and reusability
  - React root creation remains in user code for flexibility
  - Cleaner separation of concerns: engine handles COI, user handles React setup

### Runtime Debug Build Control and Performance Optimization

#### New Features

- **Production-only loader (2025-11-12)**: Simplified physics initialization to always use the production build. The `useDebug` flag has been removed from the public API and UI controls to prevent accidentally loading the heavy debug WASM.
- **Runtime debug build control (deprecated)**: Previously exposed a `useDebug` option to switch between debug and production builds at runtime.
  - Usage examples have been removed in favour of the production-only loader described above.
  - The debug build provided additional validation but incurred significant load-time penalties (~8-12s vs ~2-4s).
- **Dynamic WASM loader**: Created `loadJolt()` function in `T3DJoltLoader.ts` that automatically selects the appropriate build based on runtime environment:
  - **VS Code Webviews**: Single-threaded build (`jolt-physics/wasm-compat`) - no COI required
  - **Web Browsers**: Multi-threaded build (`jolt-physics/wasm-compat-multithread`) - requires COI for SharedArrayBuffer support
  - Automatic environment detection via `isVSCodeWebview()` function
  - Direct URI resolution fallback for VS Code webviews via `window.__JOLT_MODULE_RESOLUTION_MAP__`
  - Maintains backward compatibility with static import
- **Configurable worker thread count**: Worker thread count can now be set before physics initialization via:
  - Engine-level configuration: `new T3DEngine({ physics: { maxWorkerThreads: 8 } })`
  - Direct initialization: `engine.initPhysics({ maxWorkerThreads: 8 })`
  - Default: 5 threads (valid range: 1-16)
  - Thread count is validated and clamped to valid range with warnings

#### Performance Improvements

- **Switched to production build by default**: Changed default from debug to production build (`wasm-compat-multithread`)
  - **Load time improvement**: Reduced from ~8-12s to ~2-4s (75% faster!)
  - Production build maintains full physics functionality without debug overhead
- **Enhanced timing diagnostics**: Added detailed timing breakdown showing:
  - WASM loading time
  - Physics system initialization time
  - Total initialization time
  - Build type (DEBUG or PRODUCTION) in console logs
  - Performance warnings if loading exceeds 5 seconds (only for production builds)
- **TypeScript COI Loader**: Created `T3DCOILoader.ts` - TypeScript utility module for managing Cross-Origin Isolation (COI) service worker
  - Type-safe API with full TypeScript support
  - Configuration options for credentialless mode, degradation, quiet mode
  - Helper functions: `initCOI()`, `isCOIReady()`, `isCrossOriginIsolated()`, etc.
  - Example usage file: `T3DCOILoader.example.ts`
  - Alternative to HTML script tag approach
- **Note**: For web environments, multi-threading requires Cross-Origin Isolation (COI). Use `T3DCOILoader.ts` or see `COI-SETUP.md` for setup instructions

#### Bug Fixes

- **Fixed initialization race condition**: Added `initialized` flag to prevent `update()` from being called before physics system is fully initialized
  - Physics `update()` method now checks `initialized` flag before accessing `joltInterface`
  - Prevents "Cannot read properties of undefined (reading 'Step')" errors when animation loop starts before WASM loads
- **Fixed dynamic loader initialization**: Corrected `loadJolt()` function to actually call the init function and return the initialized module
  - Previously returned the init function instead of calling it, causing "Jolt.JoltSettings is not a constructor" errors
  - Now properly initializes and returns the Jolt module with all classes available
- **Fixed missing Jolt import in T3DSoftBodyCreator**: Added required `JoltModule` parameter to all static methods (`CreateCloth`, `CreateClothWithFixatedCorners`, `CreateCube`, `CreateSphere`) to resolve `Cannot find name 'Jolt'` error
- Added missing `THREE` import in `T3DSoftBodyCreator.ts`

#### Refactoring

- **Created centralized Jolt loader**: Added `T3DJoltLoader.ts` to centralize `initJolt` imports
- **Updated all files** to import `initJolt` from `'./T3DJoltLoader'` instead of directly importing:
  - `T3DPhysics.ts`
  - `T3DBodyCreator.ts`
  - `T3DShapeCreator.ts`
  - `T3DColliderCreator.ts`
  - `T3DMeshToConvexHull.ts`
- **Benefits**: Single source of truth for Jolt Physics imports, easier maintenance, consistent imports across codebase
