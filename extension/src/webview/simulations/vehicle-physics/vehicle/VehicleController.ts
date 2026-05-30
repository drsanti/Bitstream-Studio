/**
 * Vehicle Controller
 * Handles frame updates, input processing, and wheel transform updates
 */

import { T3DPhysics } from '@vehicle-jolt/T3DPhysics';
import type {
  Body,
  BodyInterface,
  WheeledVehicleController,
} from '@vehicle-jolt/jolt-loader';
import * as THREE from 'three';
import { gsap } from 'gsap';
import {
  steeringAnimationDuration,
  steeringAnimationEase,
} from '../config/vehicleConfig';
import { EngineSoundController } from '../utils/engineSound';

export interface EngineSoundConfig {
  minPitch: number;
  maxPitch: number;
  minVolume: number;
  maxVolume: number;
  speedFactor: number;
  baseVolume?: number; // Master volume multiplier (0.0 to 1.0)
}

export interface VehicleInputState {
  forwardPressed: boolean;
  backwardPressed: boolean;
  leftPressed: boolean;
  rightPressed: boolean;
  handBrake: boolean;
}

export class VehicleController {
  private controller: WheeledVehicleController;
  private carBody: Body;
  private bodyInterface: BodyInterface;
  private physics: T3DPhysics;
  private modelWheels: THREE.Object3D[];
  private previousForward: number = 1.0;
  private currentSteering: number = 0.0; // Current steering value (-1.0 to 1.0)
  private steeringTween: ((target: number) => void) | null = null; // GSAP quickTo function
  private engineSound: EngineSoundController | null = null;
  private engineSoundConfig: EngineSoundConfig;

  constructor(
    controller: WheeledVehicleController,
    carBody: Body,
    bodyInterface: BodyInterface,
    physics: T3DPhysics,
    modelWheels: THREE.Object3D[],
    engineSoundConfig?: EngineSoundConfig
  ) {
    this.controller = controller;
    this.carBody = carBody;
    this.bodyInterface = bodyInterface;
    this.physics = physics;
    this.modelWheels = modelWheels;

    // Initialize engine sound config with defaults or provided values
    this.engineSoundConfig = engineSoundConfig || {
      minPitch: 0.8,
      maxPitch: 1.5,
      minVolume: 0.5,
      maxVolume: 0.8,
      speedFactor: 0.5,
      baseVolume: 1.0,
    };

    // Initialize GSAP quickTo for smooth steering interpolation
    this.steeringTween = gsap.quickTo(this, 'currentSteering', {
      duration: steeringAnimationDuration,
      ease: steeringAnimationEase,
    });
  }

  /**
   * Update engine sound configuration dynamically
   */
  updateEngineSoundConfig(config: EngineSoundConfig): void {
    this.engineSoundConfig = config;
  }

  /**
   * Update steering animation settings dynamically
   * Recreates the GSAP tween with new duration and ease
   */
  updateSteeringAnimation(
    duration: number,
    ease: string = 'power2.out'
  ): void {
    // Kill existing tween
    if (this.steeringTween) {
      this.steeringTween = null;
    }

    // Create new tween with updated settings
    this.steeringTween = gsap.quickTo(this, 'currentSteering', {
      duration: duration,
      ease: ease,
    });
  }

  /**
   * Initialize engine sound controller
   * Note: Does not start playback immediately to comply with autoplay policy.
   * Playback will start automatically on first user input.
   * @param audioPath - Path to the engine sound MP3 file
   * @param config - Optional engine sound controller config
   */
  async initializeEngineSound(
    audioPath: string,
    config?: {
      animationDuration: number;
      animationEase: string;
      minVolume: number;
      minPitch: number;
      baseVolume?: number;
    }
  ): Promise<void> {
    this.engineSound = new EngineSoundController(config);
    await this.engineSound.initialize(audioPath);
    // Don't call play() here - wait for user interaction to avoid autoplay policy warning
    // Playback will start automatically via tryStartEngineSoundAfterInteraction() on first input
  }

  /**
   * Update vehicle based on input state
   */
  update(inputState: VehicleInputState): void {
    // Validate body is still valid (not destroyed)
    try {
      this.carBody.GetID();
    } catch {
      // Body has been destroyed, stop updating
      return;
    }

    let forward = 0.0;
    let brake = 0.0;
    let handBrake = 0.0;

    forward = inputState.forwardPressed
      ? 1.0
      : inputState.backwardPressed
        ? -1.0
        : 0.0;

    // Calculate target steering value from input
    const targetSteering = inputState.rightPressed
      ? 1.0
      : inputState.leftPressed
        ? -1.0
        : 0.0;

    // Smoothly interpolate steering using GSAP
    if (this.steeringTween) {
      this.steeringTween(targetSteering);
    } else {
      // Fallback if tween not initialized
      this.currentSteering = targetSteering;
    }

    // Use smoothed steering value
    const right = this.currentSteering;

    // Handle direction reversal braking
    if (this.previousForward * forward < 0.0) {
      try {
        const rotation = this.physics.wrapQuat(
          this.carBody.GetRotation().Conjugated()
        );
        const linearV = this.physics.wrapVec3(this.carBody.GetLinearVelocity());
        const velocity = linearV.applyQuaternion(rotation).z;
        if (
          (forward > 0.0 && velocity < -0.1) ||
          (forward < 0.0 && velocity > 0.1)
        ) {
          forward = 0.0;
          brake = 1.0;
        } else {
          this.previousForward = forward;
        }
      } catch {
        // Body destroyed during update, stop
        return;
      }
    }

    if (inputState.handBrake) {
      forward = 0.0;
      handBrake = 1.0;
      brake = 1.0; // Also apply regular brake for immediate stopping
    }

    try {
      this.controller.SetDriverInput(forward, right, brake, handBrake);
      if (
        right !== 0.0 ||
        forward !== 0.0 ||
        brake !== 0.0 ||
        handBrake !== 0.0
      ) {
        this.bodyInterface.ActivateBody(this.carBody.GetID());
      }
    } catch {
      // Controller or body destroyed, stop
      return;
    }

    // Update wheel transforms
    this.modelWheels.forEach((wheel) => {
      try {
        if ((wheel as any).updateLocalTransform) {
          (wheel as any).updateLocalTransform();
        }
      } catch (error) {
        // Wheel transform update failed (constraint may have been destroyed)
        // Clear the update function to prevent further errors
        (wheel as any).updateLocalTransform = null;
      }
    });

    // Update engine sound based on throttle and speed
    if (this.engineSound && this.engineSound.getIsInitialized()) {
      try {
        // Calculate throttle intensity (0.0 to 1.0) from forward input
        const throttleIntensity = Math.abs(forward);

        // Get vehicle speed from linear velocity magnitude
        const linearV = this.physics.wrapVec3(this.carBody.GetLinearVelocity());
        const speed = linearV.length(); // Speed in m/s

        // Calculate target pitch: base pitch + throttle contribution + speed contribution
        const pitchRange =
          this.engineSoundConfig.maxPitch - this.engineSoundConfig.minPitch;
        const throttlePitch = throttleIntensity * pitchRange;
        const speedPitch = Math.min(
          speed * this.engineSoundConfig.speedFactor,
          pitchRange * 0.3
        ); // Cap speed contribution
        const targetPitch =
          this.engineSoundConfig.minPitch + throttlePitch + speedPitch;

        // Calculate target volume: min volume + throttle contribution
        const volumeRange =
          this.engineSoundConfig.maxVolume - this.engineSoundConfig.minVolume;
        const calculatedVolume =
          this.engineSoundConfig.minVolume + throttleIntensity * volumeRange;
        
        // Apply base volume multiplier (master volume control)
        const baseVolume = this.engineSoundConfig.baseVolume ?? 1.0;
        const targetVolume = calculatedVolume * baseVolume;

        // Update sound
        this.engineSound.setPlaybackRate(targetPitch);
        this.engineSound.setVolume(targetVolume);
      } catch {
        // Body destroyed or error getting velocity, skip sound update
      }
    }
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    // Kill GSAP tween if it exists
    if (this.steeringTween) {
      // quickTo doesn't return a tween object, but we can reset the value
      this.currentSteering = 0.0;
      this.steeringTween = null;
    }

    // Dispose engine sound
    if (this.engineSound) {
      this.engineSound.dispose();
      this.engineSound = null;
    }
  }

  /**
   * Try to start engine sound after user interaction (for autoplay policy)
   * This should be called when user first interacts (presses keys)
   */
  async tryStartEngineSoundAfterInteraction(): Promise<void> {
    if (this.engineSound && this.engineSound.getIsInitialized()) {
      // Always try to play when user interacts, regardless of needsInteraction flag
      // The play() method will handle resuming the AudioContext
      await this.engineSound.play();
    }
  }
}
