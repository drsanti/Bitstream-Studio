/**
 * Vehicle configuration for CubeBot simulation
 */

import { degreesToRadians } from '../utils/mathUtils';

export type CastType = 'cylinder' | 'sphere' | 'ray';

export const VehicleProperties = {
  bodyPosition: [0, 2, 0] as [number, number, number],
  castType: 'sphere' as CastType,
  wheelRadius: 0.31,
  wheelWidth: 0.32,
  halfVehicleLength: 1.4,
  halfVehicleWidth: 0.8,
  halfVehicleHeight: 0.4,
} as const;

// Wheel indices
export const FL_WHEEL = 0;
export const FR_WHEEL = 1;
export const BL_WHEEL = 2;
export const BR_WHEEL = 3;

// Wheel positioning
export const wheelOffsetHorizontal = 1.0;
export const wheelOffsetVertical = 0.2;

// Suspension settings
export const suspensionMinLength = 0.1;
export const suspensionMaxLength = 0.5;

// Steering settings
export const maxSteerAngle = degreesToRadians(45);
export const steeringAnimationDuration = 1.0; // Duration in seconds for smooth steering transitions
export const steeringAnimationEase = 'power2.out'; // GSAP easing function for steering

// Drive train settings
export const fourWheelDrive = true;
export const frontBackLimitedSlipRatio = 1.4;
export const leftRightLimitedSlipRatio = 1.4;
export const antiRollbar = true;

// Physics properties
export const vehicleMass = 5000.0;
export const maxEngineTorque = 5000.0;
export const clutchStrength = 10.0;
export const wheelFriction = 0.5; // Increased friction for better grip
export const vehicleBodyFriction = 1.0; // Friction for vehicle body
export const linearDamping = 0.7; // Air resistance / linear damping (0-1, higher = more resistance)
export const angularDamping = 0.3; // Rotational damping (0-1, higher = more resistance)

// Vehicle constraint settings
export const maxPitchRollAngle = degreesToRadians(60.0);

// Engine sound settings
export const engineSoundBaseVolume = 0.3; // Base volume level (0.0 to 1.0)
export const engineSoundMinPitch = 0.8; // Minimum playback rate (idle)
export const engineSoundMaxPitch = 1.5; // Maximum playback rate (full throttle)
export const engineSoundMinVolume = 0.5; // Minimum volume (idle)
export const engineSoundMaxVolume = 0.8; // Maximum volume (full throttle)
export const engineSoundSpeedFactor = 0.5; // How much speed affects pitch (0.0 to 1.0)
export const engineSoundAnimationDuration = 0.5; // Duration in seconds for smooth sound transitions
export const engineSoundAnimationEase = 'power2.out'; // GSAP easing function for sound changes
