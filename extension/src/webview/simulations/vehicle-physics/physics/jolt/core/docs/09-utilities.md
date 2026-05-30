# Utilities Module

## Purpose

The `T3DPhysicsUtils` module provides pure utility functions for random value generation and type conversion between Jolt Physics types and Three.js types. All functions are static methods with no dependencies on other core modules.

## Exports

### Class

#### `T3DPhysicsUtils`

Static class providing utility functions. All methods are static and can be called without instantiation.

### Functions

#### `randomScalar(min: number, max: number): number`

Generates a random scalar value within a range.

**Parameters**:
- `min`: Minimum value (inclusive)
- `max`: Maximum value (exclusive)

**Returns**: Random number in range [min, max)

**Example**:
```typescript
const value = T3DPhysicsUtils.randomScalar(0, 10); // Random value between 0 and 10
```

#### `randomVec3(Jolt: JoltModule, min: number, max: number): initJolt.Vec3`

Generates a random Vec3 with components in the specified range.

**Parameters**:
- `Jolt`: Jolt module instance
- `min`: Minimum value for each component
- `max`: Maximum value for each component

**Returns**: Jolt Vec3 with random components

**Example**:
```typescript
const randomVec = T3DPhysicsUtils.randomVec3(Jolt, -1, 1);
// Creates Vec3 with x, y, z all between -1 and 1
```

#### `randomRVec3(Jolt: JoltModule, min: number, max: number): initJolt.RVec3`

Generates a random RVec3 (read-only Vec3) with components in the specified range.

**Parameters**:
- `Jolt`: Jolt module instance
- `min`: Minimum value for each component
- `max`: Maximum value for each component

**Returns**: Jolt RVec3 with random components

**Example**:
```typescript
const randomPos = T3DPhysicsUtils.randomRVec3(Jolt, 0, 10);
// Creates RVec3 suitable for body positions
```

#### `randomQuat(Jolt: JoltModule): initJolt.Quat`

Generates a random quaternion (random rotation).

**Parameters**:
- `Jolt`: Jolt module instance

**Returns**: Jolt Quat representing a random rotation

**Implementation**: Delegates to `getRandomQuat()`

**Example**:
```typescript
const randomRot = T3DPhysicsUtils.randomQuat(Jolt);
```

#### `getRandomQuat(Jolt: JoltModule): initJolt.Quat`

Generates a random quaternion using random axis and angle.

**Parameters**:
- `Jolt`: Jolt module instance

**Returns**: Jolt Quat representing a random rotation

**Algorithm**:
1. Creates random vector with small offset (0.001 + random) to avoid zero vector
2. Normalizes the vector to get random axis
3. Generates random angle (0 to 2π)
4. Creates quaternion from axis-angle representation
5. Cleans up temporary vector

**Example**:
```typescript
const quat = T3DPhysicsUtils.getRandomQuat(Jolt);
```

#### `wrapVec3(v: initJolt.Vec3 | initJolt.RVec3): THREE.Vector3`

Converts a Jolt Vec3 or RVec3 to a Three.js Vector3.

**Parameters**:
- `v`: Jolt Vec3 or RVec3

**Returns**: Three.js Vector3

**Example**:
```typescript
const joltVec = new Jolt.Vec3(1, 2, 3);
const threeVec = T3DPhysicsUtils.wrapVec3(joltVec);
console.log(threeVec.x, threeVec.y, threeVec.z); // 1, 2, 3
```

#### `wrapRVec3(v: initJolt.RVec3): THREE.Vector3`

Converts a Jolt RVec3 to a Three.js Vector3 (convenience wrapper for wrapVec3).

**Parameters**:
- `v`: Jolt RVec3

**Returns**: Three.js Vector3

**Example**:
```typescript
const joltPos = body.GetPosition(); // Returns RVec3
const threePos = T3DPhysicsUtils.wrapRVec3(joltPos);
```

#### `wrapQuat(q: initJolt.Quat): THREE.Quaternion`

Converts a Jolt Quat to a Three.js Quaternion.

**Parameters**:
- `q`: Jolt Quat

**Returns**: Three.js Quaternion

**Example**:
```typescript
const joltRot = body.GetRotation(); // Returns Quat
const threeRot = T3DPhysicsUtils.wrapQuat(joltRot);
```

#### `unwrapVec3(Jolt: JoltModule, v: THREE.Vector3): initJolt.Vec3`

Converts a Three.js Vector3 to a Jolt Vec3.

**Parameters**:
- `Jolt`: Jolt module instance
- `v`: Three.js Vector3

**Returns**: Jolt Vec3

**Example**:
```typescript
const threeVec = new THREE.Vector3(1, 2, 3);
const joltVec = T3DPhysicsUtils.unwrapVec3(Jolt, threeVec);
```

#### `unwrapRVec3(Jolt: JoltModule, v: THREE.Vector3): initJolt.RVec3`

Converts a Three.js Vector3 to a Jolt RVec3 (read-only Vec3).

**Parameters**:
- `Jolt`: Jolt module instance
- `v`: Three.js Vector3

**Returns**: Jolt RVec3

**Example**:
```typescript
const threePos = new THREE.Vector3(0, 10, 0);
const joltPos = T3DPhysicsUtils.unwrapRVec3(Jolt, threePos);
```

#### `unwrapQuat(Jolt: JoltModule, q: THREE.Quaternion): initJolt.Quat`

Converts a Three.js Quaternion to a Jolt Quat.

**Parameters**:
- `Jolt`: Jolt module instance
- `q`: Three.js Quaternion

**Returns**: Jolt Quat

**Example**:
```typescript
const threeRot = new THREE.Quaternion(0, 0, 0, 1);
const joltRot = T3DPhysicsUtils.unwrapQuat(Jolt, threeRot);
```

## Type Conversion Patterns

### Jolt → Three.js (Wrap)

Functions that "wrap" Jolt types into Three.js types:

- `wrapVec3()` / `wrapRVec3()`: Vec3/RVec3 → Vector3
- `wrapQuat()`: Quat → Quaternion

**Use Cases**:
- Getting body position/rotation for Three.js objects
- Reading physics data for rendering
- Debugging and visualization

### Three.js → Jolt (Unwrap)

Functions that "unwrap" Three.js types into Jolt types:

- `unwrapVec3()`: Vector3 → Vec3
- `unwrapRVec3()`: Vector3 → RVec3
- `unwrapQuat()`: Quaternion → Quat

**Use Cases**:
- Setting body position/rotation from Three.js objects
- Creating bodies from Three.js transforms
- Converting user input to physics types

## Random Generation

The module provides utilities for generating random values useful in physics simulations:

### Random Scalars

- `randomScalar()`: Basic random number generation
- Used by other random functions for consistency

### Random Vectors

- `randomVec3()`: Random 3D vector (mutable)
- `randomRVec3()`: Random 3D vector (read-only, for positions)

**Use Cases**:
- Random body positions
- Random velocities
- Random forces
- Procedural generation

### Random Rotations

- `randomQuat()` / `getRandomQuat()`: Random quaternion rotation

**Use Cases**:
- Random body orientations
- Procedural object placement
- Testing and demos

## Usage Examples

### Type Conversion

```typescript
import { T3DPhysicsUtils } from './core/T3DPhysicsUtils';

// Jolt → Three.js
const bodyPos = body.GetPosition(); // Jolt RVec3
const threePos = T3DPhysicsUtils.wrapRVec3(bodyPos);
debugMesh.position.copy(threePos);

// Three.js → Jolt
const threePos = new THREE.Vector3(0, 10, 0);
const joltPos = T3DPhysicsUtils.unwrapRVec3(Jolt, threePos);
body.SetPosition(joltPos);
```

### Random Generation

```typescript
// Random position
const pos = T3DPhysicsUtils.randomRVec3(Jolt, -10, 10);

// Random rotation
const rot = T3DPhysicsUtils.randomQuat(Jolt);

// Random velocity
const velocity = T3DPhysicsUtils.randomVec3(Jolt, -5, 5);
```

### Combined Usage

```typescript
// Create body with random position and rotation
const position = T3DPhysicsUtils.randomRVec3(Jolt, -10, 10);
const rotation = T3DPhysicsUtils.randomQuat(Jolt);
const body = createBody(shape, position, rotation);

// Later, sync to Three.js object
const pos = T3DPhysicsUtils.wrapRVec3(body.GetPosition());
mesh.position.copy(pos);
```

## Dependencies

This module has **no dependencies** on other core modules. It only depends on:

- Jolt module (for Jolt types)
- Three.js (for Three.js types)

## Performance Considerations

1. **No Caching**: Conversions create new objects (no object pooling)
2. **Memory**: Each conversion allocates new memory
3. **Efficiency**: Direct property access (efficient but not zero-cost)
4. **Frequency**: Conversions happen frequently in update loops

**Best Practice**: Minimize conversions in hot paths, cache results when possible.

## Related Documentation

- [Update Loop](08-update-loop.md) - Uses utilities for transform synchronization
- [Body Factories](07-body-factories.md) - Uses utilities for random object generation
- [Debug Meshes](05-debug-meshes.md) - Uses utilities for type conversion
