import * as THREE from 'three';
import type {
  PhysicsMaterial,
  EMotionType,
  Body,
  HeightFieldShapeSettings,
  PhysicsMaterialList,
} from '../jolt-loader';
import { LAYER_NON_MOVING, T3DPhysics } from '../T3DPhysics';
import { T3DShapeCreator } from '../builders';

/**
 * Options for creating HeightField
 */
export interface HeightFieldOptions {
  offset?: THREE.Vector3;
  scale?: THREE.Vector3;
  blockSize?: number;
  minHeightValue?: number;
  maxHeightValue?: number;
  material?: PhysicsMaterial;
  motionType?: EMotionType;
  position?: THREE.Vector3;
  rotation?: THREE.Quaternion;
  visualGroup?: THREE.Object3D;
  onRemoveCallback?: (
    body: Body,
    visualGroup?: THREE.Object3D
  ) => void;
}

/**
 * T3DHeightField
 *
 * Utility class for creating and managing HeightField physics bodies.
 * Supports creating HeightField from image data (ImageData, HTMLImageElement, Canvas)
 * and from mesh geometry by sampling vertices.
 * Provides full API for modifying heights, materials, and querying height field data.
 */
export class T3DHeightField extends T3DShapeCreator {
  constructor(physics: T3DPhysics) {
    super(physics);
  }

  /**
   * Helper method to create a HeightField body from shape settings
   * @private
   */
  private createHeightFieldBody(
    shapeSettings: HeightFieldShapeSettings,
    position: THREE.Vector3,
    rotation: THREE.Quaternion = new THREE.Quaternion(),
    motionType: EMotionType = this.Jolt.EMotionType_Static,
    _visualGroup?: THREE.Object3D,
    _onRemoveCallback?: (
      body: Body,
      visualGroup?: THREE.Object3D
    ) => void
  ): Body {
    // Step 1: Create the height field shape from settings
    const shapeResult = shapeSettings.Create();
    if (!shapeResult.IsValid()) {
      const error = shapeResult.GetError();
      throw new Error(`Failed to create HeightField shape: ${error}`);
    }
    const shape = shapeResult.Get();

    // Step 2: Convert position and rotation to Jolt types
    const pos = this.physics.unwrapRVec3(position);
    const rot = this.physics.unwrapQuat(rotation);

    // Step 3: Create body settings
    const bodySettings = new this.Jolt.BodyCreationSettings(
      shape,
      pos,
      rot,
      motionType,
      LAYER_NON_MOVING
    );

    // Step 4: Create the body
    const body = this.physics.getBodyInterface().CreateBody(bodySettings);

    // Step 5: Cleanup temporary objects
    this.Jolt.destroy(pos);
    this.Jolt.destroy(rot);
    this.Jolt.destroy(bodySettings);

    return body;
  }

  /**
   * Create HeightField from ImageData
   * Extracts height values from image pixels (red channel or grayscale)
   * Uses alpha channel to mark no-collision areas
   */
  public createHeightFieldFromImageData(
    imageData: ImageData,
    options?: HeightFieldOptions
  ): Body {
    // Step 1: Get image dimensions
    const width = imageData.width;
    const height = imageData.height;
    const totalSize = width * height;

    // Step 2: Create HeightField shape settings
    const shapeSettings = new this.Jolt.HeightFieldShapeSettings();

    // Step 3: Configure shape settings
    // Step 3.1: Set offset
    const offset = options?.offset || new THREE.Vector3(0, 0, 0);
    shapeSettings.mOffset.Set(offset.x, offset.y, offset.z);

    // Step 3.2: Set scale (default: 1, 0.1, 1)
    const scale = options?.scale || new THREE.Vector3(1, 0.1, 1);
    shapeSettings.mScale.Set(scale.x, scale.y, scale.z);

    // Step 3.3: Set sample count (use width, assuming square grid)
    shapeSettings.mSampleCount = width;

    // Step 3.4: Set block size (default: 2)
    shapeSettings.mBlockSize = options?.blockSize || 2;

    // Step 3.5: Set min/max height values if provided
    if (options?.minHeightValue !== undefined) {
      shapeSettings.mMinHeightValue = options.minHeightValue;
    }
    if (options?.maxHeightValue !== undefined) {
      shapeSettings.mMaxHeightValue = options.maxHeightValue;
    }

    // Step 4: Resize height samples array
    shapeSettings.mHeightSamples.resize(totalSize);

    // Step 5: Get pointer to height samples array
    const heightSamplesPtr = this.Jolt.getPointer(
      shapeSettings.mHeightSamples.data()
    );
    const heightSamples = new Float32Array(
      this.Jolt.HEAPF32.buffer,
      heightSamplesPtr,
      totalSize
    );

    // Step 6: Extract height values from image data
    const data = imageData.data;
    const noCollisionValue =
      this.Jolt.HeightFieldShapeConstantValues.prototype.cNoCollisionValue;

    for (let i = 0; i < totalSize; i++) {
      const pixelIndex = i * 4;
      const r = data[pixelIndex];
      const g = data[pixelIndex + 1];
      const b = data[pixelIndex + 2];
      const a = data[pixelIndex + 3];

      // Step 6.1: Use alpha channel to mark no-collision areas
      if (a === 0) {
        heightSamples[i] = noCollisionValue;
      } else {
        // Step 6.2: Use grayscale average for height
        const height = (r + g + b) / 3;
        heightSamples[i] = height;
      }
    }

    // Step 7: Get position and rotation (default to origin)
    const position = options?.position || new THREE.Vector3(0, 0, 0);
    const rotation = options?.rotation || new THREE.Quaternion();
    const motionType = options?.motionType || this.Jolt.EMotionType_Static;

    // Step 8: Create and return body
    return this.createHeightFieldBody(
      shapeSettings,
      position,
      rotation,
      motionType,
      options?.visualGroup,
      options?.onRemoveCallback
    );
  }

  /**
   * Create HeightField from HTMLImageElement
   * Converts image to ImageData first, then creates HeightField
   */
  public async createHeightFieldFromImage(
    image: HTMLImageElement,
    options?: HeightFieldOptions
  ): Promise<Body> {
    // Wait for image to load if not already loaded
    if (!image.complete) {
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });
    }

    // Create canvas to extract ImageData
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context from canvas');
    }

    // Draw image to canvas
    ctx.drawImage(image, 0, 0);

    // Get ImageData
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Create HeightField from ImageData
    return this.createHeightFieldFromImageData(imageData, options);
  }

  /**
   * Create HeightField from HTMLCanvasElement
   * Extracts ImageData from canvas, then creates HeightField
   */
  public createHeightFieldFromCanvas(
    canvas: HTMLCanvasElement,
    options?: HeightFieldOptions
  ): Body {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context from canvas');
    }

    // Get ImageData from canvas
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Create HeightField from ImageData
    return this.createHeightFieldFromImageData(imageData, options);
  }

  /**
   * Create HeightField from mesh geometry by sampling vertices
   * Samples the mesh at regular grid points and extracts Y (height) values
   */
  public createHeightFieldFromMesh(
    mesh: THREE.Mesh,
    sampleCount: number,
    options?: HeightFieldOptions
  ): Body {
    // Ensure mesh world matrix is up to date
    mesh.updateMatrixWorld(true);

    // Get bounding box
    const boundingBox = new THREE.Box3().setFromObject(mesh);
    const size = boundingBox.getSize(new THREE.Vector3());
    const min = boundingBox.min;

    // Clone geometry and apply world transform
    const geometry = mesh.geometry.clone();
    geometry.applyMatrix4(mesh.matrixWorld);

    // Get position attribute
    const posAttr = geometry.attributes.position;
    if (!posAttr) {
      throw new Error('Mesh geometry has no position attribute');
    }

    const vertexCount = posAttr.count;
    const vertices: THREE.Vector3[] = [];

    // Extract all vertices
    for (let i = 0; i < vertexCount; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const z = posAttr.getZ(i);
      vertices.push(new THREE.Vector3(x, y, z));
    }

    // Calculate grid spacing
    const gridSpacingX = size.x / (sampleCount - 1);
    const gridSpacingZ = size.z / (sampleCount - 1);
    const totalSize = sampleCount * sampleCount;

    // Create HeightField shape settings
    const shapeSettings = new this.Jolt.HeightFieldShapeSettings();

    // Set offset (relative to bounding box min)
    const offset = options?.offset || new THREE.Vector3(0, 0, 0);
    shapeSettings.mOffset.Set(
      min.x + offset.x,
      min.y + offset.y,
      min.z + offset.z
    );

    // Set scale (default: 1, 1, 1)
    const scale = options?.scale || new THREE.Vector3(1, 1, 1);
    shapeSettings.mScale.Set(scale.x, scale.y, scale.z);

    // Set sample count
    shapeSettings.mSampleCount = sampleCount;

    // Set block size (default: 2)
    shapeSettings.mBlockSize = options?.blockSize || 2;

    // Set min/max height values if provided
    if (options?.minHeightValue !== undefined) {
      shapeSettings.mMinHeightValue = options.minHeightValue;
    }
    if (options?.maxHeightValue !== undefined) {
      shapeSettings.mMaxHeightValue = options.maxHeightValue;
    }

    // Resize height samples array
    shapeSettings.mHeightSamples.resize(totalSize);

    // Get pointer to height samples array
    const heightSamplesPtr = this.Jolt.getPointer(
      shapeSettings.mHeightSamples.data()
    );
    const heightSamples = new Float32Array(
      this.Jolt.HEAPF32.buffer,
      heightSamplesPtr,
      totalSize
    );

    // Sample mesh at grid points
    const searchRadius = Math.max(gridSpacingX, gridSpacingZ) * 0.5;
    const noCollisionValue =
      this.Jolt.HeightFieldShapeConstantValues.prototype.cNoCollisionValue;

    for (let z = 0; z < sampleCount; z++) {
      for (let x = 0; x < sampleCount; x++) {
        const gridX = min.x + x * gridSpacingX;
        const gridZ = min.z + z * gridSpacingZ;
        const index = z * sampleCount + x;

        // Find vertices near this grid point
        const nearbyHeights: number[] = [];
        for (const vertex of vertices) {
          const dx = vertex.x - gridX;
          const dz = vertex.z - gridZ;
          const distance = Math.sqrt(dx * dx + dz * dz);

          if (distance <= searchRadius) {
            nearbyHeights.push(vertex.y);
          }
        }

        // Use average height of nearby vertices, or no-collision if none found
        if (nearbyHeights.length > 0) {
          const avgHeight =
            nearbyHeights.reduce((sum, h) => sum + h, 0) / nearbyHeights.length;
          heightSamples[index] = avgHeight;
        } else {
          heightSamples[index] = noCollisionValue;
        }
      }
    }

    // Get position (default to mesh world position)
    const position =
      options?.position ||
      (() => {
        const pos = new THREE.Vector3();
        mesh.getWorldPosition(pos);
        return pos;
      })();
    const rotation =
      options?.rotation ||
      (() => {
        const rot = new THREE.Quaternion();
        mesh.getWorldQuaternion(rot);
        return rot;
      })();
    const motionType = options?.motionType || this.Jolt.EMotionType_Static;

    // Cleanup geometry
    geometry.dispose();

    // Create and return body
    return this.createHeightFieldBody(
      shapeSettings,
      position,
      rotation,
      motionType,
      options?.visualGroup || mesh,
      options?.onRemoveCallback
    );
  }

  /**
   * Modify height values in a region of the HeightField
   */
  public modifyHeights(
    body: Body,
    x: number,
    y: number,
    sizeX: number,
    sizeY: number,
    heights: Float32Array
  ): void {
    const shape = body.GetShape();
    const heightFieldShape = this.Jolt.castObject(
      shape,
      this.Jolt.HeightFieldShape
    );

    if (!heightFieldShape) {
      throw new Error('Body does not have a HeightField shape');
    }

    // Allocate memory for heights in Jolt heap
    const heightsPtr = this.Jolt._malloc(sizeX * sizeY * 4); // 4 bytes per float
    const heightsView = new Float32Array(
      this.Jolt.HEAPF32.buffer,
      heightsPtr,
      sizeX * sizeY
    );
    heightsView.set(heights);

    // Get temp allocator
    const tempAllocator = new this.Jolt.TempAllocator();

    // Set heights
    heightFieldShape.SetHeights(
      x,
      y,
      sizeX,
      sizeY,
      heightsPtr,
      sizeX,
      tempAllocator
    );

    // Free memory
    this.Jolt._free(heightsPtr);
  }

  /**
   * Get height values from a region of the HeightField
   */
  public getHeights(
    body: Body,
    x: number,
    y: number,
    sizeX: number,
    sizeY: number
  ): Float32Array {
    const shape = body.GetShape();
    const heightFieldShape = this.Jolt.castObject(
      shape,
      this.Jolt.HeightFieldShape
    );

    if (!heightFieldShape) {
      throw new Error('Body does not have a HeightField shape');
    }

    // Allocate memory for heights in Jolt heap
    const heightsPtr = this.Jolt._malloc(sizeX * sizeY * 4); // 4 bytes per float
    const heightsView = new Float32Array(
      this.Jolt.HEAPF32.buffer,
      heightsPtr,
      sizeX * sizeY
    );

    // Get heights
    heightFieldShape.GetHeights(x, y, sizeX, sizeY, heightsPtr, sizeX);

    // Copy to new array (since Jolt memory will be reused)
    const result = new Float32Array(heightsView);

    // Free memory
    this.Jolt._free(heightsPtr);

    return result;
  }

  /**
   * Set material indices for a region of the HeightField
   */
  public setMaterials(
    body: Body,
    x: number,
    y: number,
    sizeX: number,
    sizeY: number,
    materials: Uint8Array,
    materialList: PhysicsMaterialList
  ): boolean {
    const shape = body.GetShape();
    const heightFieldShape = this.Jolt.castObject(
      shape,
      this.Jolt.HeightFieldShape
    );

    if (!heightFieldShape) {
      throw new Error('Body does not have a HeightField shape');
    }

    // Allocate memory for materials in Jolt heap
    const materialsPtr = this.Jolt._malloc(sizeX * sizeY); // 1 byte per uint8
    const materialsView = new Uint8Array(
      this.Jolt.HEAPU8.buffer,
      materialsPtr,
      sizeX * sizeY
    );
    materialsView.set(materials);

    // Get temp allocator
    const tempAllocator = new this.Jolt.TempAllocator();

    // Set materials
    const success = heightFieldShape.SetMaterials(
      x,
      y,
      sizeX,
      sizeY,
      materialsPtr,
      sizeX,
      materialList,
      tempAllocator
    );

    // Free memory
    this.Jolt._free(materialsPtr);

    return success;
  }

  /**
   * Get material indices from a region of the HeightField
   */
  public getMaterials(
    body: Body,
    x: number,
    y: number,
    sizeX: number,
    sizeY: number
  ): Uint8Array {
    const shape = body.GetShape();
    const heightFieldShape = this.Jolt.castObject(
      shape,
      this.Jolt.HeightFieldShape
    );

    if (!heightFieldShape) {
      throw new Error('Body does not have a HeightField shape');
    }

    // Allocate memory for materials in Jolt heap
    const materialsPtr = this.Jolt._malloc(sizeX * sizeY); // 1 byte per uint8
    const materialsView = new Uint8Array(
      this.Jolt.HEAPU8.buffer,
      materialsPtr,
      sizeX * sizeY
    );

    // Get materials
    heightFieldShape.GetMaterials(x, y, sizeX, sizeY, materialsPtr, sizeX);

    // Copy to new array (since Jolt memory will be reused)
    const result = new Uint8Array(materialsView);

    // Free memory
    this.Jolt._free(materialsPtr);

    return result;
  }

  /**
   * Get world position at grid coordinates
   */
  public getPosition(body: Body, x: number, y: number): THREE.Vector3 {
    const shape = body.GetShape();
    const heightFieldShape = this.Jolt.castObject(
      shape,
      this.Jolt.HeightFieldShape
    );

    if (!heightFieldShape) {
      throw new Error('Body does not have a HeightField shape');
    }

    // Get position from HeightField
    const pos = heightFieldShape.GetPosition(x, y);

    // Convert to THREE.Vector3
    const result = new THREE.Vector3(pos.GetX(), pos.GetY(), pos.GetZ());

    // Get body transform and apply it
    const bodyPos = body.GetPosition();
    const bodyRot = body.GetRotation();

    // Apply body transform
    result.applyQuaternion(this.physics.wrapQuat(bodyRot));
    result.add(this.physics.wrapVec3(bodyPos));

    return result;
  }

  /**
   * Check if a grid point has no collision
   */
  public isNoCollision(body: Body, x: number, y: number): boolean {
    const shape = body.GetShape();
    const heightFieldShape = this.Jolt.castObject(
      shape,
      this.Jolt.HeightFieldShape
    );

    if (!heightFieldShape) {
      throw new Error('Body does not have a HeightField shape');
    }

    return heightFieldShape.IsNoCollision(x, y);
  }
}
