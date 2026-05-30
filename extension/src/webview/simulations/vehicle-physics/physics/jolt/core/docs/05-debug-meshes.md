# Debug Meshes Module

## Purpose

The `T3DPhysicsDebugMesh` module handles the creation of visual debug representations for physics bodies. It provides functions for creating wireframe meshes, detecting shape types, caching materials, and mapping shape types to colors.

## Exports

### Functions

#### `createDebugMesh(Jolt, body, shapeType, materialCache)`

Creates a debug mesh for a physics body with appropriate geometry and material.

**Parameters**:

- `Jolt`: Jolt module instance
- `body`: Jolt Physics body
- `shapeType`: EShapeSubType constant identifying the shape type
- `materialCache`: Map for caching materials by shape type

**Returns**: Object with:
- `debugMesh`: THREE.Object3D (Mesh) representing the physics body
- `updateVertex`: Optional function for updating soft body vertices

**Supported Shape Types**:

The function has optimized geometry creation for common shapes:

- **Box**: Uses `BoxGeometry` with validated extents
- **Sphere**: Uses `SphereGeometry` with 8 segments (performance optimized)
- **Capsule**: Uses `CapsuleGeometry` with optimized segment count
- **Cylinder**: Uses `CylinderGeometry` with 8 segments
- **Other Shapes**: Falls back to `createMeshForShape()` for triangle extraction
- **Soft Bodies**: Delegates to `getSoftBodyMesh()` for soft body meshes

**Geometry Validation**: All geometries are validated to prevent NaN values that could cause rendering errors.

#### `getShapeType(Jolt, shapeOrBody): number`

Unwraps decorated shapes to get the actual inner shape type.

**Parameters**:

- `Jolt`: Jolt module instance
- `shapeOrBody`: Either a Jolt Shape or Body (if Body, extracts the shape)

**Returns**: EShapeSubType constant for the actual (non-decorated) shape

**Decorated Shapes**: Handles wrapper shapes that wrap other shapes:

- `EShapeSubType_Scaled`: Scaled wrapper
- `EShapeSubType_RotatedTranslated`: Rotated/translated wrapper
- `EShapeSubType_OffsetCenterOfMass`: Center of mass offset wrapper

The function recursively unwraps until it finds the actual underlying shape type.

**Example**:
```typescript
const shapeType = getShapeType(Jolt, body);
// Returns the actual shape type, not a wrapper type
```

#### `getDebugMeshColor(Jolt, shapeType): THREE.Color`

Maps each EShapeSubType to a distinct color for visualization.

**Parameters**:

- `Jolt`: Jolt module instance
- `shapeType`: EShapeSubType constant

**Returns**: THREE.Color instance for the shape type

**Color Mapping**:

| Shape Type | Color | Hex Code |
|------------|-------|----------|
| Sphere | Red | 0xff3333 |
| Box | Orange | 0xff8800 |
| Capsule | Yellow | 0xffff00 |
| Cylinder | Lime | 0x88ff00 |
| TaperedCapsule | Green | 0x00ff33 |
| TaperedCylinder | Cyan | 0x00ffcc |
| ConvexHull | Light Blue | 0x0088ff |
| StaticCompound | Purple | 0x8833ff |
| MutableCompound | Magenta | 0xff00ff |
| OffsetCenterOfMass | Pink | 0xff0088 |
| Mesh | Cyan (bright) | 0x00ffff |
| HeightField | Light Green | 0x66ff66 |
| Plane | Gray | 0xc7c7c7 |
| Empty | Dark Gray | 0x888888 |
| RotatedTranslated | Orange-Red | 0xff8844 |
| Scaled | Green-Cyan | 0x44ff88 |
| Default | White | 0xffffff |

**Note**: When using `MeshNormalMaterial` (default), colors are determined by surface normals, not this color mapping. This color mapping is used only when `MeshStandardMaterial` is enabled.

#### `getDebugMeshMaterial(Jolt, shapeType, materialCache)`

Gets or creates a material for a given shape type with caching.

**Parameters**:

- `Jolt`: Jolt module instance
- `shapeType`: EShapeSubType constant
- `materialCache`: Map for caching materials (key: shapeType, value: Material)

**Returns**: THREE.MeshNormalMaterial or THREE.MeshStandardMaterial

**Material Types**:

1. **MeshNormalMaterial** (when `USE_NORMAL_MATERIAL` is true):
   - Colors based on surface normals
   - No lights required
   - Wireframe: true
   - Opacity: 0.9
   - Performance optimized

2. **MeshStandardMaterial** (when `USE_NORMAL_MATERIAL` is false):
   - Uses Phong shading with shape-specific colors
   - Requires lights in the scene
   - Wireframe: true
   - Opacity: 0.5
   - Metalness: 0, Roughness: 1

**Caching**: Materials are cached by shape type to avoid creating duplicate materials. This improves performance and reduces memory usage.

**Example**:
```typescript
const material = getDebugMeshMaterial(Jolt, Jolt.EShapeSubType_Sphere, materialCache);
```

#### `disableShadowsOnObject(object: THREE.Object3D): void`

Disables shadows on a Three.js object and all its children.

**Parameters**:

- `object`: Three.js object to disable shadows on

**Behavior**:

- Sets `castShadow = false` and `receiveShadow = false` on the object if it's a Mesh
- Recursively traverses all children and disables shadows on all Mesh objects
- Ensures debug meshes never cast or receive shadows

**Usage**: Called automatically when debug meshes are created and added to the scene.

## Shape Type Detection

The module handles shape type detection with support for decorated/wrapper shapes:

```typescript
// Direct shape type
const shapeType = shape.GetSubType(); // E.g., EShapeSubType_Sphere

// Wrapped shape (needs unwrapping)
const scaledShape = new ScaledShape(innerShape, scale);
// getShapeType() will unwrap and return the inner shape type
```

## Material Caching Strategy

Materials are cached to improve performance:

1. **Cache Key**: Shape type (EShapeSubType constant)
2. **Cache Location**: Material cache map passed as parameter (owned by T3DPhysics class)
3. **Cache Lifetime**: Materials persist for the lifetime of the physics system
4. **Disposal**: All cached materials are disposed when the physics system is disposed

**Benefits**:
- One material per shape type (not per body)
- Reduced memory usage
- Faster material creation (cache lookup vs. new material creation)

## Geometry Creation Details

### Optimized Shapes

Common shapes use optimized Three.js geometries:

- **Box**: Simple box geometry with minimal segments
- **Sphere**: 8x8 segments (reduced from default for performance)
- **Capsule**: 4 radial segments, 8 height segments
- **Cylinder**: 8 radial segments, 1 height segment

### Fallback for Complex Shapes

For shapes without optimized geometry creation:

1. Uses `createMeshForShape()` to extract triangles from Jolt shape
2. Creates BufferGeometry from triangle data
3. Computes vertex normals for proper rendering

### Soft Bodies

For soft bodies:

1. Delegates to `getSoftBodyMesh()` from ShapeMesh module
2. Creates dynamic geometry that can be updated each frame
3. Returns both mesh and `updateVertex` callback

## NaN Validation

All geometries are validated to prevent NaN values:

- Extents are checked with `isFinite()`
- Invalid values are replaced with safe defaults
- Warnings are logged when NaN values are detected
- Prevents rendering errors and crashes

## Usage Examples

### Basic Debug Mesh Creation

```typescript
import { createDebugMesh } from './core/T3DPhysicsDebugMesh';

const result = createDebugMesh(Jolt, body, Jolt.EShapeSubType_Sphere, materialCache);
const debugMesh = result.debugMesh;
scene.add(debugMesh);
```

### Shape Type Detection

```typescript
import { getShapeType } from './core/T3DPhysicsDebugMesh';

const shapeType = getShapeType(Jolt, body);
console.log('Shape type:', shapeType);
```

### Custom Material Access

```typescript
import { getDebugMeshMaterial } from './core/T3DPhysicsDebugMesh';

const material = getDebugMeshMaterial(Jolt, Jolt.EShapeSubType_Box, materialCache);
console.log('Material:', material);
```

## Dependencies

- **T3DPhysicsConfig**: For `USE_NORMAL_MATERIAL` constant
- **T3DPhysicsShapeMesh**: For `createMeshForShape()` and `getSoftBodyMesh()`
- **T3DPhysicsUtils**: For type conversion utilities

## Performance Considerations

1. **Material Caching**: Reduces material creation overhead
2. **Optimized Geometries**: Reduced segment counts for common shapes
3. **Geometry Reuse**: Same geometry can be used for multiple bodies of same type
4. **Wireframe Mode**: Wireframe rendering is faster than filled geometry

## Related Documentation

- [Shape Meshes](06-shape-meshes.md) - Shape-to-geometry conversion
- [Body Management](04-body-management.md) - How debug meshes are used
- [Configuration](02-configuration.md) - Material type configuration
