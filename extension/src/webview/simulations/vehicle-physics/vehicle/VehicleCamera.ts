/**
 * Vehicle Camera System
 * Manages a camera positioned in front of the vehicle that renders to a texture
 */

import * as THREE from 'three';
import { T3DPhysics } from '@vehicle-jolt/T3DPhysics';
import type { Body } from '@vehicle-jolt/jolt-loader';

export interface VehicleCameraOptions {
  /** Camera field of view in degrees */
  fov?: number;
  /** Render target width */
  width?: number;
  /** Render target height */
  height?: number;
  /** Camera position offset from vehicle center (in vehicle local space) */
  positionOffset?: THREE.Vector3;
  /** Camera look-at offset from vehicle center (in vehicle local space) */
  lookAtOffset?: THREE.Vector3;
  /** Show camera helper by default */
  showHelper?: boolean;
}

const DEFAULT_OPTIONS: Required<VehicleCameraOptions> = {
  fov: 75,
  width: 512,
  height: 512,
  positionOffset: new THREE.Vector3(0, 1, 2), // 2m forward, 1m up
  lookAtOffset: new THREE.Vector3(0, 0, 5), // Look 5m ahead
  showHelper: false, // Hide camera helper by default
};

export class VehicleCamera {
  private camera: THREE.PerspectiveCamera;
  private renderTarget: THREE.WebGLRenderTarget;
  private physics: T3DPhysics;
  private options: Required<VehicleCameraOptions>;
  private scene?: THREE.Scene;
  private renderer?: THREE.WebGLRenderer;
  private objectsToHide: THREE.Object3D[] = [];
  private cameraHelper?: THREE.CameraHelper;
  private frameCounter: number = 0;

  constructor(
    physics: T3DPhysics,
    scene: THREE.Scene,
    renderer: THREE.WebGLRenderer,
    options?: VehicleCameraOptions
  ) {
    this.physics = physics;
    this.scene = scene;
    this.renderer = renderer;
    this.options = { ...DEFAULT_OPTIONS, ...options };

    // Create perspective camera
    this.camera = new THREE.PerspectiveCamera(
      this.options.fov,
      this.options.width / this.options.height,
      0.1,
      1000
    );

    // Create render target
    this.renderTarget = new THREE.WebGLRenderTarget(
      this.options.width,
      this.options.height,
      {
        format: THREE.RGBAFormat,
        type: THREE.UnsignedByteType,
        generateMipmaps: true,
        minFilter: THREE.LinearMipmapLinearFilter,
        magFilter: THREE.LinearFilter,
      }
    );

    // Create camera helper
    this.cameraHelper = new THREE.CameraHelper(this.camera);
    const showHelper = options?.showHelper ?? false;
    this.cameraHelper.visible = showHelper;
    if (this.scene) {
      this.scene.add(this.cameraHelper);
    }
  }

  /**
   * Update camera position and rotation to follow vehicle
   * @param carBody - The vehicle physics body
   */
  update(carBody: Body): void {
    if (!this.scene || !this.renderer) return;

    try {
      // Get vehicle position and rotation from physics
      const bodyPos = this.physics.wrapVec3(carBody.GetPosition());
      const bodyRot = this.physics.wrapQuat(carBody.GetRotation());

      // Calculate camera position in world space
      const localOffset = this.options.positionOffset.clone();
      const worldPosition = localOffset.applyQuaternion(bodyRot).add(bodyPos);

      // Calculate look-at position in world space
      const localLookAt = this.options.lookAtOffset.clone();
      const worldLookAt = localLookAt.applyQuaternion(bodyRot).add(bodyPos);

      // Set camera position and look at target
      this.camera.position.copy(worldPosition);
      this.camera.lookAt(worldLookAt);
      this.camera.updateMatrixWorld(true);

      // Update camera helper if it exists
      if (this.cameraHelper) {
        this.cameraHelper.update();
      }
    } catch (error) {
      // Body may have been destroyed
      console.warn('VehicleCamera: Failed to update camera transform', error);
    }
  }

  /**
   * Add an object to hide during rendering (prevents feedback loops)
   * @param object - Object to hide during camera render
   */
  addObjectToHide(object: THREE.Object3D): void {
    if (!this.objectsToHide.includes(object)) {
      this.objectsToHide.push(object);
    }
  }

  /**
   * Remove an object from the hide list
   * @param object - Object to remove from hide list
   */
  removeObjectToHide(object: THREE.Object3D): void {
    const index = this.objectsToHide.indexOf(object);
    if (index > -1) {
      this.objectsToHide.splice(index, 1);
    }
  }

  /**
   * Render the scene from camera's perspective to render target
   * Hides objects that use the render target texture to prevent feedback loops
   */
  render(): void {
    if (!this.scene || !this.renderer) return;

    // Hide objects that use the render target texture (prevents feedback loop)
    const hiddenObjects: THREE.Object3D[] = [];
    this.objectsToHide.forEach((obj) => {
      if (obj.visible) {
        obj.visible = false;
        hiddenObjects.push(obj);
      }
    });

    // Hide camera helper during render to prevent it from appearing in the render target
    // The helper should only be visible in the main scene, not in the camera's view
    let helperWasVisible = false;
    if (this.cameraHelper) {
      helperWasVisible = this.cameraHelper.visible;
      if (helperWasVisible) {
        this.cameraHelper.visible = false;
      }
    }

    // Store original render target
    const originalRenderTarget = this.renderer.getRenderTarget();
    const originalAutoClear = this.renderer.autoClear;

    // Set render target and render
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.autoClear = true;
    this.renderer.render(this.scene, this.camera);

    // Restore original render target
    this.renderer.setRenderTarget(originalRenderTarget);
    this.renderer.autoClear = originalAutoClear;

    // Restore visibility of hidden objects
    hiddenObjects.forEach((obj) => {
      obj.visible = true;
    });

    // Restore camera helper visibility (only if it was visible before)
    if (this.cameraHelper && helperWasVisible) {
      this.cameraHelper.visible = true;
    }
  }

  /**
   * Get the render target texture
   */
  getTexture(): THREE.Texture {
    return this.renderTarget.texture;
  }

  /**
   * Get the camera instance
   */
  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * Get the render target
   */
  getRenderTarget(): THREE.WebGLRenderTarget {
    return this.renderTarget;
  }

  /**
   * Extract texture data from render target to canvas element
   * Handles Y-axis flipping (WebGL uses bottom-left origin, canvas uses top-left)
   * Applies gamma correction to convert from linear to sRGB color space
   * @param canvas - Canvas element to draw the texture to
   */
  extractTextureToCanvas(canvas: HTMLCanvasElement): void {
    if (!this.renderer) return;

    const width = this.options.width;
    const height = this.options.height;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Create buffer to read pixel data
    const buffer = new Uint8Array(width * height * 4);

    // Store original render target
    const originalRenderTarget = this.renderer.getRenderTarget();

    // Read pixels from render target
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.readRenderTargetPixels(
      this.renderTarget,
      0,
      0,
      width,
      height,
      buffer
    );

    // Restore original render target
    this.renderer.setRenderTarget(originalRenderTarget);

    // Get 2D context
    const ctx = canvas.getContext('2d', { 
      willReadFrequently: false, // Optimize for write operations
      alpha: true 
    });
    if (!ctx) {
      console.error('Failed to get 2D context from canvas');
      return;
    }

    // Create ImageData from buffer
    const imageData = ctx.createImageData(width, height);

    // Gamma correction function: convert linear to sRGB
    const linearToSRGB = (linear: number): number => {
      if (linear <= 0.0031308) {
        return 12.92 * linear;
      }
      return 1.055 * Math.pow(linear, 1.0 / 2.4) - 0.055;
    };

    // Flip Y-axis and apply gamma correction: WebGL origin is bottom-left, canvas is top-left
    for (let y = 0; y < height; y++) {
      const srcY = height - 1 - y; // Flip Y coordinate
      for (let x = 0; x < width; x++) {
        const srcIndex = (srcY * width + x) * 4;
        const dstIndex = (y * width + x) * 4;

        // Convert from linear (0-255) to normalized (0-1), apply gamma, convert back
        const rLinear = buffer[srcIndex] / 255.0;
        const gLinear = buffer[srcIndex + 1] / 255.0;
        const bLinear = buffer[srcIndex + 2] / 255.0;

        // Apply gamma correction
        const rSRGB = linearToSRGB(rLinear);
        const gSRGB = linearToSRGB(gLinear);
        const bSRGB = linearToSRGB(bLinear);

        // Convert back to 0-255 range
        imageData.data[dstIndex] = Math.round(rSRGB * 255);
        imageData.data[dstIndex + 1] = Math.round(gSRGB * 255);
        imageData.data[dstIndex + 2] = Math.round(bSRGB * 255);
        imageData.data[dstIndex + 3] = buffer[srcIndex + 3]; // Alpha unchanged
      }
    }

    // Draw to canvas
    ctx.putImageData(imageData, 0, 0);
    
    // Force canvas update for captureStream
    // This ensures captureStream detects the canvas update even when keys are held
    // The issue is that captureStream only captures when canvas is "dirty"
    // We increment frame counter and draw a tiny invisible pixel to ensure canvas is always "dirty"
    this.frameCounter++;
    
    // Draw a 1x1 pixel at the bottom-right corner with frame counter as alpha
    // This ensures the canvas is always considered "updated" even if the main content is the same
    // This is necessary because captureStream may not detect updates during key repeat events
    if (canvas.width > 0 && canvas.height > 0) {
      const pixelData = ctx.createImageData(1, 1);
      // Use frame counter modulo 256 to ensure pixel changes every frame
      // This forces the browser to recognize the canvas as updated
      pixelData.data[3] = this.frameCounter % 256; // Alpha channel
      ctx.putImageData(pixelData, canvas.width - 1, canvas.height - 1);
    }
  }

  /**
   * Get texture as data URL for use in img element
   * @returns Data URL string or null if extraction fails
   */
  getTextureAsDataURL(): string | null {
    // Create temporary canvas for extraction
    const canvas = document.createElement('canvas');
    this.extractTextureToCanvas(canvas);
    return canvas.toDataURL('image/png');
  }

  /**
   * Show camera helper (frustum visualization)
   */
  showHelper(): void {
    if (!this.cameraHelper) {
      // Create helper if it doesn't exist
      this.cameraHelper = new THREE.CameraHelper(this.camera);
    }
    this.cameraHelper.visible = true;
    if (this.scene && !this.scene.children.includes(this.cameraHelper)) {
      this.scene.add(this.cameraHelper);
    }
    // Update helper to reflect current camera state
    this.cameraHelper.update();
  }

  /**
   * Hide camera helper
   */
  hideHelper(): void {
    if (this.cameraHelper) {
      this.cameraHelper.visible = false;
    }
  }

  /**
   * Toggle camera helper visibility
   */
  toggleHelper(): void {
    if (this.cameraHelper) {
      this.cameraHelper.visible = !this.cameraHelper.visible;
      if (
        this.cameraHelper.visible &&
        this.scene &&
        !this.scene.children.includes(this.cameraHelper)
      ) {
        this.scene.add(this.cameraHelper);
      }
    }
  }

  /**
   * Get camera helper instance
   */
  getHelper(): THREE.CameraHelper | undefined {
    return this.cameraHelper;
  }

  /**
   * Update render target size
   */
  setSize(width: number, height: number): void {
    this.renderTarget.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.options.width = width;
    this.options.height = height;

    // Update camera helper if it exists
    if (this.cameraHelper) {
      this.cameraHelper.update();
    }
  }

  /**
   * Update field of view
   */
  setFov(fov: number): void {
    this.options.fov = fov;
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
    if (this.cameraHelper) {
      this.cameraHelper.update();
    }
  }

  /**
   * Get current field of view
   */
  getFov(): number {
    return this.options.fov;
  }

  /**
   * Update position offset
   */
  setPositionOffset(x: number, y: number, z: number): void {
    this.options.positionOffset.set(x, y, z);
  }

  /**
   * Get current position offset
   */
  getPositionOffset(): THREE.Vector3 {
    return this.options.positionOffset.clone();
  }

  /**
   * Update look-at offset
   */
  setLookAtOffset(x: number, y: number, z: number): void {
    this.options.lookAtOffset.set(x, y, z);
  }

  /**
   * Get current look-at offset
   */
  getLookAtOffset(): THREE.Vector3 {
    return this.options.lookAtOffset.clone();
  }

  /**
   * Get current render target size
   */
  getSize(): { width: number; height: number } {
    return { width: this.options.width, height: this.options.height };
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    // Remove camera helper from scene
    if (this.cameraHelper && this.scene) {
      this.scene.remove(this.cameraHelper);
      this.cameraHelper.dispose();
      this.cameraHelper = undefined;
    }

    this.renderTarget.dispose();
    // Camera doesn't need explicit disposal in Three.js
  }
}
