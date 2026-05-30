# Configuration Module

## Purpose

The `T3DPhysicsConfig` module provides configuration constants, options interface, and static methods for configuring the T3D Physics system. This module has no dependencies on other core modules and serves as the foundation for physics system configuration.

## Exports

### Constants

#### `LAYER_NON_MOVING`
- **Type**: `number`
- **Value**: `0`
- **Purpose**: Object layer identifier for non-moving (static) physics bodies
- **Usage**: Used when creating static bodies and in collision filtering

#### `LAYER_MOVING`
- **Type**: `number`
- **Value**: `1`
- **Purpose**: Object layer identifier for moving (dynamic) physics bodies
- **Usage**: Used when creating dynamic bodies and in collision filtering

#### `NUM_OBJECT_LAYERS`
- **Type**: `number`
- **Value**: `2`
- **Purpose**: Total number of object layers in the physics system
- **Usage**: Used during collision filtering setup to configure layer pair filters

#### `USE_NORMAL_MATERIAL`
- **Type**: `boolean`
- **Value**: `true`
- **Purpose**: Determines whether to use `MeshNormalMaterial` (true) or `MeshStandardMaterial` (false) for debug meshes
- **Usage**: Used by the debug mesh module when creating materials

### Interfaces

#### `T3DPhysicsOptions`

Interface for physics initialization options:

```typescript
interface T3DPhysicsOptions {
  /** Maximum number of worker threads for multi-threaded physics (1-16, default: 5) */
  maxWorkerThreads?: number;
  /** Line width in world units for wireframe rendering (default: 0.005) */
  wireframeLineWidth?: number;
}
```

**Properties**:

- `maxWorkerThreads` (optional): Maximum number of worker threads for multi-threaded physics simulation. Range: 1-16. Default: 5. Set to 0 for single-threaded mode.
- `wireframeLineWidth` (optional): Line width for wireframe rendering of debug meshes. Default: 0.005.

### Class

#### `T3DPhysicsConfig`

Static class providing configuration utilities:

##### `configureThreading(isWebview: boolean): void`

Configures T3D engine to try multi-threading in VS Code webviews.

**Parameters**:
- `isWebview`: Whether running in VS Code webview environment

**Behavior**:
- If `isWebview` is true, configures the engine to attempt multi-threading
- Creates physics configuration in `T3DEngineConfig` if it doesn't exist
- Allows multi-threading by default (usually 5 threads)
- Will fallback to single-threaded if worker initialization fails

**Example**:
```typescript
T3DPhysicsConfig.configureThreading(true);
```

##### `setMaxWorkerThreads(maxThreads: number): void`

Sets the maximum worker threads for physics in `T3DEngineConfig`.

**Parameters**:
- `maxThreads`: Maximum number of worker threads (0 = single-threaded, 1-16 for multi-threaded)

**Behavior**:
- Creates physics configuration in `T3DEngineConfig` if it doesn't exist
- Sets `maxWorkerThreads` in the configuration
- This value will be used when initializing the physics system

**Example**:
```typescript
T3DPhysicsConfig.setMaxWorkerThreads(5); // Use 5 worker threads
T3DPhysicsConfig.setMaxWorkerThreads(0); // Single-threaded mode
```

##### `getConfig(): PhysicsOptions | undefined`

Gets the current physics configuration from `T3DEngineConfig`.

**Returns**: Current physics options or `undefined` if not configured

**Example**:
```typescript
const config = T3DPhysicsConfig.getConfig();
if (config?.maxWorkerThreads) {
  console.log(`Using ${config.maxWorkerThreads} worker threads`);
}
```

## Usage Patterns

### Basic Configuration

```typescript
import { T3DPhysicsConfig, LAYER_NON_MOVING, LAYER_MOVING } from './core/T3DPhysicsConfig';

// Set worker threads
T3DPhysicsConfig.setMaxWorkerThreads(5);

// Use layer constants
const staticBody = physics.createBox(position, rotation, extent, motionType, LAYER_NON_MOVING);
const dynamicBody = physics.createSphere(position, radius, motionType, LAYER_MOVING);
```

### VS Code Webview Configuration

```typescript
// Configure for VS Code webview environment
T3DPhysicsConfig.configureThreading(true);

// Then create physics system
const physics = new T3DPhysics(engine, { maxWorkerThreads: 5 });
```

### Reading Configuration

```typescript
// Check current configuration
const config = T3DPhysicsConfig.getConfig();
if (config) {
  console.log('Physics configured:', config);
}
```

## Dependencies

This module has **no dependencies** on other core modules. It depends only on:

- `T3DEngineConfig` from `@/engine/T3DEngineConfig`
- `PhysicsOptions` from `@/engine/T3DEngineOptions`

## Implementation Notes

### Layer System

The physics system uses a layer-based collision filtering system:

- **Layer 0 (LAYER_NON_MOVING)**: For static bodies that don't move
- **Layer 1 (LAYER_MOVING)**: For dynamic bodies that move

The collision filter allows:
- Non-moving ↔ Moving: Yes (static bodies collide with dynamic)
- Moving ↔ Moving: Yes (dynamic bodies collide with each other)
- Non-moving ↔ Non-moving: No (static bodies don't collide with each other)

This configuration is set up in the initialization module using these constants.

### Material Selection

The `USE_NORMAL_MATERIAL` constant controls which material type is used for debug meshes:

- **MeshNormalMaterial** (true): Colors based on surface normals, no lights needed, good for quick visualization
- **MeshStandardMaterial** (false): Uses Phong shading with color, requires lights, more realistic but slower

Currently set to `true` for performance and simplicity.

## Related Documentation

- [Initialization](03-initialization.md) - How configuration is used during initialization
- [Debug Meshes](05-debug-meshes.md) - How `USE_NORMAL_MATERIAL` affects debug visualization
- [Module Dependencies](10-module-dependencies.md) - Dependency graph
