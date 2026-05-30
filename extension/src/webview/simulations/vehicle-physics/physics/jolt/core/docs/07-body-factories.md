# Body Factories Module

## Purpose

The `T3DPhysicsBodyFactory` module provides convenient factory methods for creating common physics body types. These methods simplify body creation by handling shape creation, body setup, and automatic registration with the physics system.

## Exports

### Interfaces

#### `BodyFactoryState`

Interface extending `BodyManagerState` with additional physics system access:

```typescript
interface BodyFactoryState extends BodyManagerState {
  physicsSystem: initJolt.PhysicsSystem;
}
```

**Additional Property**:
- `physicsSystem`: Physics system for advanced operations (used by some factory methods)

### Functions

#### `createFloor(state, size?): initJolt.Body`

Creates a static floor (box) at the specified size.

**Parameters**:
- `state`: Body factory state
- `size`: Floor size (default: 50)

**Returns**: Created physics body

**Details**:
- Creates a static box shape with zero convex radius (prevents object penetration)
- Position: `(0, -2.5, 0)` (centered on X/Z, below origin)
- Rotation: Identity
- Motion Type: Static
- Layer: `LAYER_NON_MOVING`
- Automatically registered with physics system

**Example**:
```typescript
const floor = createFloor(state, 100); // 100x100 floor
```

#### `createBox(state, position, rotation, halfExtent, motionType, layer): initJolt.Body`

Creates a box physics body.

**Parameters**:
- `state`: Body factory state
- `position`: Initial position (RVec3)
- `rotation`: Initial rotation (Quat)
- `halfExtent`: Half extents of the box (Vec3)
- `motionType`: Motion type (Static, Dynamic, Kinematic)
- `layer`: Object layer (LAYER_NON_MOVING or LAYER_MOVING)

**Returns**: Created physics body

**Details**:
- Creates BoxShape with 0.05 convex radius
- Body is automatically registered with physics system

**Example**:
```typescript
const halfExtent = new Jolt.Vec3(1, 1, 1);
const position = new Jolt.RVec3(0, 10, 0);
const rotation = new Jolt.Quat(0, 0, 0, 1);
const box = createBox(
  state,
  position,
  rotation,
  halfExtent,
  Jolt.EMotionType_Dynamic,
  LAYER_MOVING
);
```

#### `createSphere(state, position, radius, motionType, layer): initJolt.Body`

Creates a sphere physics body.

**Parameters**:
- `state`: Body factory state
- `position`: Initial position (RVec3)
- `radius`: Sphere radius (number)
- `motionType`: Motion type
- `layer`: Object layer

**Returns**: Created physics body

**Details**:
- Creates SphereShape
- Rotation: Identity (spheres are rotationally symmetric)
- Body is automatically registered with physics system

**Example**:
```typescript
const position = new Jolt.RVec3(0, 10, 0);
const sphere = createSphere(
  state,
  position,
  0.5, // radius
  Jolt.EMotionType_Dynamic,
  LAYER_MOVING
);
```

#### `createMeshFloor(state, n, cellSize, _maxHeight, posX, posY, posZ): void`

Creates a mesh floor from a triangle grid with height function.

**Parameters**:
- `state`: Body factory state
- `n`: Grid resolution (n x n cells)
- `cellSize`: Size of each grid cell
- `_maxHeight`: Maximum height (currently unused, reserved for future use)
- `posX`, `posY`, `posZ`: Position of the floor

**Returns**: void (body is registered automatically)

**Details**:
- Creates a regular grid of triangles
- Height function: `sin(x/2) * cos(y/3)` (can be customized)
- Creates MeshShape from triangle list
- Motion Type: Static
- Layer: `LAYER_NON_MOVING`
- Body is automatically registered

**Example**:
```typescript
createMeshFloor(state, 50, 1.0, 10, 0, 0, 0);
// Creates 50x50 grid floor at origin
```

#### `addRandomObjectToScene(state): void`

Adds a random object to the scene (useful for testing and demos).

**Parameters**:
- `state`: Body factory state

**Returns**: void

**Random Shape Types**:

The function randomly selects from these shape types:

1. Sphere
2. Box
3. Cylinder
4. TaperedCylinder
5. Capsule
6. TaperedCapsule
7. ConvexHull (10 random points)
8. StaticCompound (3 shapes: 2 spheres + 1 capsule)
9. MutableCompound (3 shapes: sphere + box + capsule)
10. OffsetCenterOfMass (sphere with COM offset)

**Body Properties**:
- Position: Random position in area (-12.5 to 12.5 on X/Z, 20 on Y)
- Rotation: Random rotation
- Motion Type: Dynamic
- Layer: `LAYER_MOVING`
- Restitution: 0.2 (bouncy)
- Linear Damping: 0.1 (air resistance)
- Angular Damping: 0.2 (rotational damping)
- Body is automatically registered

**Use Cases**:
- Testing physics system
- Demo applications
- Stress testing

**Example**:
```typescript
addRandomObjectToScene(state); // Adds one random object
```

## Factory Method Pattern

All factory methods follow a consistent pattern:

1. **Create Shape**: Create appropriate Jolt shape
2. **Create Body Settings**: Configure body creation settings
3. **Create Body**: Use body interface to create body
4. **Register Body**: Automatically register with physics system
5. **Cleanup**: Destroy temporary Jolt objects (Vec3, RVec3, Quat, settings)
6. **Return**: Return created body (or void for some methods)

## Resource Management

Factory methods handle Jolt resource cleanup:

### Objects That Are Destroyed

- **Vec3, RVec3, Quat**: Destroyed after use (copied by constructors)
- **BodyCreationSettings**: Destroyed after body creation (body takes ownership)
- **Shape Settings**: Destroyed after shape creation (shape takes ownership)

### Objects That Are NOT Destroyed

- **Shape**: Owned by body, destroyed when body is destroyed
- **Body**: Returned to caller, must be destroyed via body interface

### Ownership Flow

```
Shape → BodyCreationSettings → Body
  ↓            ↓                 ↓
Created    Takes reference   Takes ownership
                                    ↓
                              Destroyed via
                            bodyInterface.DestroyBody()
```

## Usage Examples

### Creating a Simple Scene

```typescript
// Create floor
const floor = createFloor(state, 50);

// Create some boxes
for (let i = 0; i < 10; i++) {
  const pos = new Jolt.RVec3(
    (Math.random() - 0.5) * 20,
    10,
    (Math.random() - 0.5) * 20
  );
  const halfExtent = new Jolt.Vec3(0.5, 0.5, 0.5);
  createBox(state, pos, identityQuat, halfExtent, EMotionType_Dynamic, LAYER_MOVING);
}
```

### Creating Spheres

```typescript
// Create spheres in a grid
for (let x = -5; x <= 5; x++) {
  for (let z = -5; z <= 5; z++) {
    const pos = new Jolt.RVec3(x * 2, 10, z * 2);
    createSphere(state, pos, 0.5, EMotionType_Dynamic, LAYER_MOVING);
  }
}
```

### Terrain Generation

```typescript
// Create terrain mesh
createMeshFloor(state, 100, 0.5, 5, 0, 0, 0);
```

### Stress Testing

```typescript
// Add many random objects
for (let i = 0; i < 100; i++) {
  addRandomObjectToScene(state);
}
```

## Dependencies

- **T3DPhysicsBodyManager**: For `registerPhysicsBody()` function
- **T3DPhysicsConfig**: For layer constants
- **T3DPhysicsUtils**: For random value generation (used in `addRandomObjectToScene`)

## Advanced Usage

### Custom Body Properties

After creating a body, you can modify its properties:

```typescript
const body = createSphere(state, position, 0.5, EMotionType_Dynamic, LAYER_MOVING);

// Modify body properties
const motionProperties = body.GetMotionProperties();
motionProperties.SetLinearVelocity(new Jolt.Vec3(0, 5, 0)); // Initial velocity
motionProperties.SetGravityFactor(0.5); // Reduce gravity
```

### Custom Shapes

For shapes not covered by factory methods, create them manually:

```typescript
// Create custom shape
const customShape = new Jolt.CapsuleShape(halfHeight, radius);

// Create body settings
const settings = new Jolt.BodyCreationSettings(
  customShape,
  position,
  rotation,
  motionType,
  layer
);

// Create and register body
const body = bodyInterface.CreateBody(settings);
registerPhysicsBody(state, { body });
Jolt.destroy(settings);
```

## Related Documentation

- [Body Management](04-body-management.md) - Body registration details
- [Utilities](09-utilities.md) - Random value generation utilities
- [Configuration](02-configuration.md) - Layer constants
