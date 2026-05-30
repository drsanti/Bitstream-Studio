/**
 * Vehicle Setup Hook
 * Manages vehicle initialization, cleanup, rebuild, and frame callbacks
 */

import { useRef, useEffect, useCallback } from 'react';
import { VehicleSimulationEngine } from '@vehicle-engine';
import * as THREE from 'three';
import type { Body } from '@vehicle-jolt/jolt-loader';
import type { T3DDynamicObject } from '@vehicle-jolt/core/T3DPhysicsBodyManager';
import { FourWheelVehicle } from '../vehicle/FourWheelVehicle';
import { VehicleController } from '../vehicle/VehicleController';
import { VehicleCamera } from '../vehicle/VehicleCamera';
import { VehicleInputState } from '../vehicle/VehicleController';
import { useVehicleConfigStore } from '../store/vehicle-config-store';
import { useCameraSettingsStore } from '../store/camera-settings-store';
import { useDebugSettingsStore } from '../store/debug-settings-store';
import {
  extractVehicleConfigFromStore,
  extractVehicleModels,
} from '../utils/vehicleConfigUtils';
import { createScreenMesh, disposeScreenMesh } from '../utils/screenMeshUtils';
import { resolveVehicleEngineSoundUrl, getRemoteVehicleEngineSoundUrl } from '../utils/resolveVehicleEngineSoundUrl';

export interface UseVehicleSetupReturn {
  /** Rebuild vehicle with current config from store */
  rebuildVehicle: () => Promise<void>;
  /** Vehicle camera ref (for texture extraction) */
  vehicleCameraRef: React.MutableRefObject<VehicleCamera | null>;
  /** Vehicle ref (for runtime parameter updates) */
  vehicleRef: React.MutableRefObject<FourWheelVehicle | null>;
  /** Vehicle controller ref (for runtime parameter updates) */
  vehicleControllerRef: React.MutableRefObject<VehicleController | null>;
}

export interface UseVehicleSetupOptions {
  /** VehicleSimulationEngine engine instance */
  engine: VehicleSimulationEngine | null | undefined;
  /** Loaded 3D model */
  model: THREE.Object3D | null | undefined;
  /** Whether engine initializer is ready */
  isInitialized: boolean;
  /** Input state ref for vehicle controls */
  inputStateRef: React.MutableRefObject<VehicleInputState>;
  /** Extract texture function ref (for camera texture extraction) */
  extractTextureRef: React.MutableRefObject<(() => void) | null>;
  /** Target FPS ref for canvas rendering throttling */
  targetFpsRef: React.MutableRefObject<number>;
  /** Filled when controller is ready — call on key/pointer down to unlock Web Audio */
  unlockEngineSoundRef?: React.MutableRefObject<(() => void) | null>;
}

/**
 * Hook to manage vehicle setup, initialization, cleanup, and rebuild
 */
export function useVehicleSetup({
  engine,
  model,
  isInitialized,
  inputStateRef,
  extractTextureRef,
  targetFpsRef,
  unlockEngineSoundRef,
}: UseVehicleSetupOptions): UseVehicleSetupReturn {
  // Vehicle refs
  const vehicleRef = useRef<FourWheelVehicle | null>(null);
  const vehicleControllerRef = useRef<VehicleController | null>(null);
  const vehicleCameraRef = useRef<VehicleCamera | null>(null);
  const screenMeshRef = useRef<THREE.Mesh | null>(null);
  const carBodyRef = useRef<Body | null>(null);
  const cleanupFrameRef = useRef<(() => void) | null>(null);

  // State flags
  const isInitializedRef = useRef<boolean>(false);
  const soundInteractionHandledRef = useRef<boolean>(false);
  const isRebuildingRef = useRef<boolean>(false);

  // Time tracking for FPS-based texture extraction throttling
  const lastExtractionTimeRef = useRef<number>(0);

  /**
   * Bumps on each effect lifecycle (mount/unmount). Async `initializeVehicle` compares its
   * captured epoch to this ref so stale in-flight work (React StrictMode, webview remounts)
   * disposes its own FourWheelVehicle instead of registering a second car on the engine.
   */
  const vehicleSetupEpochRef = useRef(0);

  /**
   * Cleanup all vehicle-related resources
   */
  const cleanupVehicle = useCallback(() => {
    // Cleanup frame callback
    if (cleanupFrameRef.current) {
      cleanupFrameRef.current();
      cleanupFrameRef.current = null;
    }

    // Cleanup screen mesh
    disposeScreenMesh(screenMeshRef.current, vehicleCameraRef.current);
    screenMeshRef.current = null;

    // Cleanup vehicle camera
    if (vehicleCameraRef.current) {
      vehicleCameraRef.current.dispose();
      vehicleCameraRef.current = null;
    }

    // Reset refs
    carBodyRef.current = null;
    isInitializedRef.current = false;
    soundInteractionHandledRef.current = false;

    // Cleanup vehicle
    if (vehicleRef.current) {
      vehicleRef.current.cleanup();
      vehicleRef.current = null;
    }

    // Cleanup controller
    if (vehicleControllerRef.current) {
      vehicleControllerRef.current.dispose();
      vehicleControllerRef.current = null;
    }
  }, []);

  /**
   * Initialize or rebuild vehicle with current config
   * @param skipEnvironment - If true, skip floor and ball creation (for rebuilds)
   */
  const initializeVehicle = useCallback(
    async (skipEnvironment: boolean = false, setupEpoch?: number) => {
      if (!engine || !model) {
        console.warn('Cannot initialize vehicle: engine or model not ready');
        return;
      }

      // Check if physics is actually initialized (not relying on physicsInitialized prop)
      const physics = engine.getPhysics();
      if (!physics || !physics.isInitialized()) {
        console.warn('Cannot initialize vehicle: Physics not initialized');
        return;
      }

      // Check if graphics/scene is initialized
      if (!engine.getScene()) {
        console.warn(
          'Cannot initialize vehicle: Scene is not initialized. Please call engine.initializeGraphics() first.'
        );
        return;
      }

      const epoch = setupEpoch ?? vehicleSetupEpochRef.current;
      const stale = () => epoch !== vehicleSetupEpochRef.current;

      // Extract models and config
      const models = extractVehicleModels(model);
      const storeConfig = useVehicleConfigStore.getState();
      const vehicleConfig = extractVehicleConfigFromStore(storeConfig);

      // Initialize vehicle
      const vehicle = new FourWheelVehicle(physics);
      const components = await vehicle.initialize(
        models,
        vehicleConfig,
        skipEnvironment
      );

      if (stale()) {
        vehicle.cleanup();
        return;
      }

      if (!components || !components.carBody) {
        console.error(
          'Failed to initialize vehicle: components or carBody is null'
        );
        throw new Error('Failed to initialize vehicle');
      }

      vehicleRef.current = vehicle;
      carBodyRef.current = components.carBody;

      // Wait a frame for physics system to register the vehicle and all physics objects
      await new Promise((resolve) => setTimeout(resolve, 0));

      if (stale()) {
        cleanupVehicle();
        return;
      }

      // Apply debug settings from store after all objects are registered
      // This ensures floor, balls, and vehicle are all properly configured
      const debugSettings = useDebugSettingsStore.getState();
      vehicle.setVehiclePartsDebugMeshVisibility(
        debugSettings.showVehiclePartsDebug,
        debugSettings.vehiclePartsDebugOpacity,
        debugSettings.vehiclePartsDebugColor
      );
      vehicle.setPhysicsObjectsDebugMeshVisibility(
        debugSettings.showPhysicsObjectsDebug,
        debugSettings.physicsObjectsDebugOpacity,
        debugSettings.physicsObjectsDebugColor
      );

      // Verify vehicle was added to physics system
      const dynamicObjects = physics.getDynamicObjects();
      let vehicleDynamicObj = dynamicObjects.find(
        (obj: T3DDynamicObject) => obj.body === components.carBody
      );
      if (!vehicleDynamicObj) {
        console.error(
          'Vehicle body was not found in physics system after initialization'
        );
        // Try waiting a bit more
        await new Promise((resolve) => setTimeout(resolve, 50));
        if (stale()) {
          cleanupVehicle();
          return;
        }
        const dynamicObjectsRetry = physics.getDynamicObjects();
        vehicleDynamicObj = dynamicObjectsRetry.find(
          (obj: T3DDynamicObject) => obj.body === components.carBody
        );
        if (!vehicleDynamicObj) {
          throw new Error(
            'Vehicle body not registered in physics system after retry'
          );
        }
      }

      if (stale()) {
        cleanupVehicle();
        return;
      }

      // Get engine sound config from store
      const soundConfig = useVehicleConfigStore.getState();
      const engineSoundConfig: Parameters<
        typeof VehicleController.prototype.initializeEngineSound
      >[1] = {
        animationDuration: soundConfig.engineSoundAnimationDuration,
        animationEase: soundConfig.engineSoundAnimationEase,
        minVolume: soundConfig.engineSoundMinVolume,
        minPitch: soundConfig.engineSoundMinPitch,
        baseVolume: soundConfig.engineSoundBaseVolume,
      };

      // Create vehicle controller with engine sound config
      const controller = new VehicleController(
        components.controller,
        components.carBody,
        physics.getBodyInterface(),
        physics,
        components.modelWheels,
        {
          minPitch: soundConfig.engineSoundMinPitch,
          maxPitch: soundConfig.engineSoundMaxPitch,
          minVolume: soundConfig.engineSoundMinVolume,
          maxVolume: soundConfig.engineSoundMaxVolume,
          speedFactor: soundConfig.engineSoundSpeedFactor,
          baseVolume: soundConfig.engineSoundBaseVolume,
        }
      );
      vehicleControllerRef.current = controller;

      // Initialize engine sound (bundled asset, then GitHub fallback)
      try {
        await controller.initializeEngineSound(
          resolveVehicleEngineSoundUrl(),
          engineSoundConfig
        );
      } catch (error) {
        console.warn(
          'Bundled engine sound failed, trying remote URL:',
          error
        );
        try {
          await controller.initializeEngineSound(
            getRemoteVehicleEngineSoundUrl(),
            engineSoundConfig
          );
        } catch (remoteError) {
          console.error('Error initializing engine sound:', remoteError);
        }
      }

      if (stale()) {
        cleanupVehicle();
        return;
      }

      // Initialize vehicle camera
      const graphics = engine.getGraphics();
      const scene = graphics.getScene();
      const renderer = graphics.getRenderer();
      if (!scene || !renderer) {
        console.error('Failed to get scene or renderer for vehicle camera');
      } else {
        // Load camera settings from store (with defaults if not saved)
        const cameraSettings = useCameraSettingsStore.getState();

        // Create vehicle camera with saved settings from store
        const vehicleCamera = new VehicleCamera(physics, scene, renderer, {
          width: cameraSettings.width,
          height: cameraSettings.height,
          fov: cameraSettings.fov,
          positionOffset: new THREE.Vector3(
            cameraSettings.positionOffset.x,
            cameraSettings.positionOffset.y,
            cameraSettings.positionOffset.z
          ),
          lookAtOffset: new THREE.Vector3(
            cameraSettings.lookAtOffset.x,
            cameraSettings.lookAtOffset.y,
            cameraSettings.lookAtOffset.z
          ),
          showHelper: cameraSettings.showHelper,
        });
        vehicleCameraRef.current = vehicleCamera;

        // Get vehicle debug mesh by finding the one that matches the car body
        // Wait a bit more to ensure debug mesh is created
        await new Promise((resolve) => setTimeout(resolve, 50));
        if (stale()) {
          cleanupVehicle();
          return;
        }
        const dynamicObjectsForMesh = physics.getDynamicObjects();
        const vehicleDynamicObjForMesh = dynamicObjectsForMesh.find(
          (obj: T3DDynamicObject) => obj.body === components.carBody
        );
        const vehicleDebugMesh = vehicleDynamicObjForMesh?.debugMesh;

        if (!vehicleDebugMesh) {
          console.warn(
            'Vehicle debug mesh not found - vehicle may not be visible'
          );
        }

        // Create and attach screen mesh
        const screenMesh = createScreenMesh(vehicleCamera, vehicleDebugMesh);
        screenMeshRef.current = screenMesh;
      }

      if (stale()) {
        cleanupVehicle();
        return;
      }

      // Set up frame callback for vehicle updates
      const frameCallback = () => {
        if (!isInitializedRef.current) return;
        if (!vehicleControllerRef.current) return;
        if (isRebuildingRef.current) return;

        // Handle autoplay policy: start sound on first user input
        if (
          !soundInteractionHandledRef.current &&
          vehicleControllerRef.current
        ) {
          const hasInput =
            inputStateRef.current.forwardPressed ||
            inputStateRef.current.backwardPressed ||
            inputStateRef.current.leftPressed ||
            inputStateRef.current.rightPressed ||
            inputStateRef.current.handBrake;

          if (hasInput) {
            vehicleControllerRef.current
              .tryStartEngineSoundAfterInteraction()
              .catch((error) => {
                console.error('Error starting engine sound:', error);
              });
            soundInteractionHandledRef.current = true;
          }
        }

        vehicleControllerRef.current.update(inputStateRef.current);

        // Update and render vehicle camera
        if (vehicleCameraRef.current && carBodyRef.current) {
          vehicleCameraRef.current.update(carBodyRef.current);
          vehicleCameraRef.current.render();

          // Extract texture with FPS-based throttling for performance
          if (extractTextureRef.current) {
            const targetFps = targetFpsRef.current;

            if (targetFps === 0) {
              // Unlimited - extract every frame
              extractTextureRef.current();
            } else {
              const now = performance.now();
              const minIntervalMs = 1000 / targetFps;
              const timeSinceLastExtraction =
                now - lastExtractionTimeRef.current;

              if (timeSinceLastExtraction >= minIntervalMs) {
                extractTextureRef.current();
                lastExtractionTimeRef.current = now;
              }
            }
          }
        }
      };

      cleanupFrameRef.current = engine.onFrame(frameCallback);
      isInitializedRef.current = true;
    },
    [engine, model, inputStateRef, extractTextureRef, targetFpsRef, cleanupVehicle]
  );

  /**
   * Rebuild vehicle with current config from store
   */
  const rebuildVehicle = useCallback(async () => {
    if (!engine || !model) {
      console.warn('Cannot rebuild vehicle: engine or model not ready');
      return;
    }

    // Check if physics is actually initialized
    const physics = engine.getPhysics();
    if (!physics || !physics.isInitialized()) {
      console.warn('Cannot rebuild vehicle: Physics not initialized');
      return;
    }

    // Set flag to prevent frame callback from updating during rebuild
    isRebuildingRef.current = true;

    try {
      // Cleanup current vehicle
      cleanupVehicle();

      // Reinitialize vehicle (skip floor and ball creation during rebuild)
      await initializeVehicle(true, vehicleSetupEpochRef.current);
    } catch (error) {
      console.error('Error rebuilding vehicle:', error);
    } finally {
      // Clear flag to allow frame callback to resume
      isRebuildingRef.current = false;
    }
  }, [engine, model, cleanupVehicle, initializeVehicle]);

  /** Resume AudioContext / start loop — must run during a user gesture (keydown). */
  const unlockEngineSound = useCallback(() => {
    if (soundInteractionHandledRef.current)
    {
      return;
    }
    const controller = vehicleControllerRef.current;
    if (!controller)
    {
      return;
    }
    void controller.tryStartEngineSoundAfterInteraction().then(() => {
      soundInteractionHandledRef.current = true;
    }).catch((error) => {
      console.error('Error starting engine sound:', error);
    });
  }, []);

  useEffect(() => {
    if (!unlockEngineSoundRef)
    {
      return;
    }
    unlockEngineSoundRef.current = unlockEngineSound;
    return () => {
      unlockEngineSoundRef.current = null;
    };
  }, [unlockEngineSound, unlockEngineSoundRef]);

  // Initial vehicle setup
  useEffect(() => {
    if (!engine || !model || !isInitialized) return;

    const epoch = ++vehicleSetupEpochRef.current;
    void initializeVehicle(false, epoch);

    const epochRef = vehicleSetupEpochRef;
    return () => {
      epochRef.current += 1;
      cleanupVehicle();
    };
  }, [engine, model, isInitialized, initializeVehicle, cleanupVehicle]);

  return {
    rebuildVehicle,
    vehicleCameraRef,
    vehicleRef,
    vehicleControllerRef,
  };
}
