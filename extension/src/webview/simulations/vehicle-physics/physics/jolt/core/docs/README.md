# T3DPhysics Core Modules Documentation

## Introduction

The T3DPhysics core modules represent a modular refactoring of the original monolithic `T3DPhysics.ts` file. This modular architecture improves code organization, maintainability, and testability by separating concerns into focused, single-responsibility modules.

## Overview

The T3DPhysics system was originally implemented as a single large class (~1874 lines). To improve maintainability and clarity, the implementation has been refactored into specialized modules, each handling a specific aspect of the physics system:

- **Configuration** - Constants, options, and static configuration methods
- **Initialization** - System setup, WASM loading, and collision filtering
- **Body Management** - Registration, removal, and lifecycle management
- **Debug Meshes** - Visual representation creation for physics bodies
- **Shape Meshes** - Geometry conversion from Jolt shapes to Three.js
- **Body Factories** - Convenient factory methods for creating common body types
- **Update Loop** - Physics simulation stepping and transform synchronization
- **Utilities** - Helper functions for type conversion and random generation

The main `T3DPhysics` class remains as a facade that delegates to these modules, ensuring 100% backward compatibility with existing code.

## Module Organization

All core modules are located in the `src/T3D/physics-jolt/core/` directory:

```
core/
├── T3DPhysicsConfig.ts        # Configuration and constants
├── T3DPhysicsInitializer.ts   # System initialization
├── T3DPhysicsBodyManager.ts   # Body lifecycle management
├── T3DPhysicsDebugMesh.ts     # Debug mesh creation
├── T3DPhysicsShapeMesh.ts     # Shape-to-geometry conversion
├── T3DPhysicsBodyFactory.ts   # Body factory methods
├── T3DPhysicsUpdate.ts        # Update loop and simulation
├── T3DPhysicsUtils.ts         # Utility functions
└── docs/                      # This documentation
```

## Table of Contents

1. [Architecture Overview](01-overview.md)
   - Modular design principles
   - Module organization and structure
   - How modules interact with T3DPhysics facade

2. [Configuration](02-configuration.md)
   - Configuration constants and options
   - Threading configuration
   - T3DPhysicsOptions interface

3. [Initialization](03-initialization.md)
   - System initialization flow
   - COI readiness verification
   - WASM module loading
   - Collision filtering setup

4. [Body Management](04-body-management.md)
   - T3DDynamicObject interface
   - Body registration and removal
   - Visual group disposal
   - State management

5. [Debug Meshes](05-debug-meshes.md)
   - Debug mesh creation
   - Shape type detection
   - Material caching
   - Color mapping

6. [Shape Meshes](06-shape-meshes.md)
   - Shape to geometry conversion
   - Soft body mesh creation
   - Triangle extraction and validation

7. [Body Factories](07-body-factories.md)
   - Factory methods (createFloor, createBox, createSphere)
   - Mesh floor creation
   - Random object generation

8. [Update Loop](08-update-loop.md)
   - Physics simulation update cycle
   - Time stepping and sub-stepping
   - Transform synchronization
   - Pause/resume functionality

9. [Utilities](09-utilities.md)
   - Random value generation
   - Jolt/Three.js type conversions
   - Vector and quaternion utilities

10. [Module Dependencies](10-module-dependencies.md)
    - Dependency graph
    - State management patterns
    - Best practices

## Quick Reference

### Core Modules

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| `T3DPhysicsConfig` | Configuration and constants | Constants, T3DPhysicsOptions, static config methods |
| `T3DPhysicsInitializer` | System initialization | `initializePhysicsSystem()`, `setupCollisionFiltering()` |
| `T3DPhysicsBodyManager` | Body lifecycle | `registerPhysicsBody()`, `removeFromScene()`, `T3DDynamicObject` |
| `T3DPhysicsDebugMesh` | Debug visualization | `createDebugMesh()`, `getDebugMeshMaterial()`, `getShapeType()` |
| `T3DPhysicsShapeMesh` | Geometry conversion | `createMeshForShape()`, `getSoftBodyMesh()` |
| `T3DPhysicsBodyFactory` | Body creation | `createFloor()`, `createBox()`, `createSphere()`, etc. |
| `T3DPhysicsUpdate` | Simulation loop | `updatePhysics()`, `startPhysics()`, `stopPhysics()` |
| `T3DPhysicsUtils` | Helper functions | Type conversion, random generation utilities |

## Usage

Most users will interact with the `T3DPhysics` class directly, which internally uses these modules. The modules are designed to be used by the main class, but they can also be imported directly if needed for advanced use cases.

For typical usage, refer to the main [T3DPhysics documentation](../../docs/ARCHITECTURE.md).

For detailed information about each module, see the corresponding documentation files listed in the table of contents above.
