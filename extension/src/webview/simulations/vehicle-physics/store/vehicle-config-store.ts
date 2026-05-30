/**
 * Vehicle Configuration Store
 * Manages vehicle configuration state using Zustand with localStorage persistence
 */

import { create } from 'zustand';
import {
  suspensionMinLength,
  suspensionMaxLength,
  maxSteerAngle,
  steeringAnimationDuration,
  fourWheelDrive,
  frontBackLimitedSlipRatio,
  leftRightLimitedSlipRatio,
  antiRollbar,
  vehicleMass,
  maxEngineTorque,
  clutchStrength,
  wheelFriction,
  vehicleBodyFriction,
  linearDamping,
  angularDamping,
  maxPitchRollAngle,
  engineSoundBaseVolume,
  engineSoundMinPitch,
  engineSoundMaxPitch,
  engineSoundMinVolume,
  engineSoundMaxVolume,
  engineSoundSpeedFactor,
  engineSoundAnimationDuration,
  engineSoundAnimationEase,
  VehicleProperties,
  CastType,
} from '../config/vehicleConfig';

export interface VehicleConfigState {
  // Suspension
  suspensionMinLength: number;
  suspensionMaxLength: number;

  // Steering
  maxSteerAngle: number; // in radians
  steeringAnimationDuration: number;

  // Drive Train
  fourWheelDrive: boolean;
  frontBackLimitedSlipRatio: number;
  leftRightLimitedSlipRatio: number;
  antiRollbar: boolean;

  // Physics
  vehicleMass: number;
  maxEngineTorque: number;
  clutchStrength: number;
  wheelFriction: number;
  vehicleBodyFriction: number;
  linearDamping: number;
  angularDamping: number;
  maxPitchRollAngle: number; // in radians

  // Engine Sound
  engineSoundBaseVolume: number;
  engineSoundMinPitch: number;
  engineSoundMaxPitch: number;
  engineSoundMinVolume: number;
  engineSoundMaxVolume: number;
  engineSoundSpeedFactor: number;
  engineSoundAnimationDuration: number;
  engineSoundAnimationEase: string;

  // Vehicle Properties
  bodyPositionX: number;
  bodyPositionY: number;
  bodyPositionZ: number;
  castType: CastType;
  wheelRadius: number;
  wheelWidth: number;
  halfVehicleLength: number;
  halfVehicleWidth: number;
  halfVehicleHeight: number;

  // Setters - Suspension
  setSuspensionMinLength: (value: number) => void;
  setSuspensionMaxLength: (value: number) => void;

  // Setters - Steering
  setMaxSteerAngle: (value: number) => void; // expects radians
  setSteeringAnimationDuration: (value: number) => void;

  // Setters - Drive Train
  setFourWheelDrive: (value: boolean) => void;
  setFrontBackLimitedSlipRatio: (value: number) => void;
  setLeftRightLimitedSlipRatio: (value: number) => void;
  setAntiRollbar: (value: boolean) => void;

  // Setters - Physics
  setVehicleMass: (value: number) => void;
  setMaxEngineTorque: (value: number) => void;
  setClutchStrength: (value: number) => void;
  setWheelFriction: (value: number) => void;
  setVehicleBodyFriction: (value: number) => void;
  setLinearDamping: (value: number) => void;
  setAngularDamping: (value: number) => void;
  setMaxPitchRollAngle: (value: number) => void; // expects radians

  // Setters - Engine Sound
  setEngineSoundBaseVolume: (value: number) => void;
  setEngineSoundMinPitch: (value: number) => void;
  setEngineSoundMaxPitch: (value: number) => void;
  setEngineSoundMinVolume: (value: number) => void;
  setEngineSoundMaxVolume: (value: number) => void;
  setEngineSoundSpeedFactor: (value: number) => void;
  setEngineSoundAnimationDuration: (value: number) => void;
  setEngineSoundAnimationEase: (value: string) => void;

  // Setters - Vehicle Properties
  setBodyPositionX: (value: number) => void;
  setBodyPositionY: (value: number) => void;
  setBodyPositionZ: (value: number) => void;
  setCastType: (value: CastType) => void;
  setWheelRadius: (value: number) => void;
  setWheelWidth: (value: number) => void;
  setHalfVehicleLength: (value: number) => void;
  setHalfVehicleWidth: (value: number) => void;
  setHalfVehicleHeight: (value: number) => void;

  // Persistence
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
}

const STORAGE_KEY = 'vehicle-config-store';

// Helper function to get default values
const getDefaultValues = () => ({
  suspensionMinLength,
  suspensionMaxLength,
  maxSteerAngle,
  steeringAnimationDuration,
  fourWheelDrive,
  frontBackLimitedSlipRatio,
  leftRightLimitedSlipRatio,
  antiRollbar,
  vehicleMass,
  maxEngineTorque,
  clutchStrength,
  wheelFriction,
  vehicleBodyFriction,
  linearDamping,
  angularDamping,
  maxPitchRollAngle,
  engineSoundBaseVolume,
  engineSoundMinPitch,
  engineSoundMaxPitch,
  engineSoundMinVolume,
  engineSoundMaxVolume,
  engineSoundSpeedFactor,
  engineSoundAnimationDuration,
  engineSoundAnimationEase,
  bodyPositionX: VehicleProperties.bodyPosition[0],
  bodyPositionY: VehicleProperties.bodyPosition[1],
  bodyPositionZ: VehicleProperties.bodyPosition[2],
  castType: VehicleProperties.castType,
  wheelRadius: VehicleProperties.wheelRadius,
  wheelWidth: VehicleProperties.wheelWidth,
  halfVehicleLength: VehicleProperties.halfVehicleLength,
  halfVehicleWidth: VehicleProperties.halfVehicleWidth,
  halfVehicleHeight: VehicleProperties.halfVehicleHeight,
});

// Load from localStorage on initialization
const loadSavedConfig = (): Partial<VehicleConfigState> | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return null;
    }

    const parsed = JSON.parse(saved);

    // Validate that all required fields are present
    const defaults = getDefaultValues();
    const loaded: Partial<VehicleConfigState> = {};

    // Only load fields that exist in defaults (safety check)
    Object.keys(defaults).forEach((key) => {
      if (
        key in parsed &&
        typeof parsed[key] === typeof defaults[key as keyof typeof defaults]
      ) {
        loaded[key as keyof VehicleConfigState] = parsed[key];
      }
    });

    return Object.keys(loaded).length > 0 ? loaded : null;
  } catch (error) {
    console.warn(
      'Failed to load saved vehicle config from localStorage:',
      error
    );
    return null;
  }
};

// Get initial state (load from localStorage or use defaults)
const savedConfig = loadSavedConfig();
const initialState = savedConfig
  ? { ...getDefaultValues(), ...savedConfig }
  : getDefaultValues();

export const useVehicleConfigStore = create<VehicleConfigState>((set, get) => ({
  // Initial values (loaded from localStorage if available, otherwise defaults)
  ...initialState,

  // Setters - Suspension
  setSuspensionMinLength: (value: number) => {
    set({ suspensionMinLength: value });
    get().saveToLocalStorage();
  },
  setSuspensionMaxLength: (value: number) => {
    set({ suspensionMaxLength: value });
    get().saveToLocalStorage();
  },

  // Setters - Steering
  setMaxSteerAngle: (value: number) => {
    set({ maxSteerAngle: value });
    get().saveToLocalStorage();
  },
  setSteeringAnimationDuration: (value: number) => {
    set({ steeringAnimationDuration: value });
    get().saveToLocalStorage();
  },

  // Setters - Drive Train
  setFourWheelDrive: (value: boolean) => {
    set({ fourWheelDrive: value });
    get().saveToLocalStorage();
  },
  setFrontBackLimitedSlipRatio: (value: number) => {
    set({ frontBackLimitedSlipRatio: value });
    get().saveToLocalStorage();
  },
  setLeftRightLimitedSlipRatio: (value: number) => {
    set({ leftRightLimitedSlipRatio: value });
    get().saveToLocalStorage();
  },
  setAntiRollbar: (value: boolean) => {
    set({ antiRollbar: value });
    get().saveToLocalStorage();
  },

  // Setters - Physics
  setVehicleMass: (value: number) => {
    set({ vehicleMass: value });
    get().saveToLocalStorage();
  },
  setMaxEngineTorque: (value: number) => {
    set({ maxEngineTorque: value });
    get().saveToLocalStorage();
  },
  setClutchStrength: (value: number) => {
    set({ clutchStrength: value });
    get().saveToLocalStorage();
  },
  setWheelFriction: (value: number) => {
    set({ wheelFriction: value });
    get().saveToLocalStorage();
  },
  setVehicleBodyFriction: (value: number) => {
    set({ vehicleBodyFriction: value });
    get().saveToLocalStorage();
  },
  setLinearDamping: (value: number) => {
    set({ linearDamping: value });
    get().saveToLocalStorage();
  },
  setAngularDamping: (value: number) => {
    set({ angularDamping: value });
    get().saveToLocalStorage();
  },
  setMaxPitchRollAngle: (value: number) => {
    set({ maxPitchRollAngle: value });
    get().saveToLocalStorage();
  },

  // Setters - Engine Sound
  setEngineSoundBaseVolume: (value: number) => {
    set({ engineSoundBaseVolume: value });
    get().saveToLocalStorage();
  },
  setEngineSoundMinPitch: (value: number) => {
    set({ engineSoundMinPitch: value });
    get().saveToLocalStorage();
  },
  setEngineSoundMaxPitch: (value: number) => {
    set({ engineSoundMaxPitch: value });
    get().saveToLocalStorage();
  },
  setEngineSoundMinVolume: (value: number) => {
    set({ engineSoundMinVolume: value });
    get().saveToLocalStorage();
  },
  setEngineSoundMaxVolume: (value: number) => {
    set({ engineSoundMaxVolume: value });
    get().saveToLocalStorage();
  },
  setEngineSoundSpeedFactor: (value: number) => {
    set({ engineSoundSpeedFactor: value });
    get().saveToLocalStorage();
  },
  setEngineSoundAnimationDuration: (value: number) => {
    set({ engineSoundAnimationDuration: value });
    get().saveToLocalStorage();
  },
  setEngineSoundAnimationEase: (value: string) => {
    set({ engineSoundAnimationEase: value });
    get().saveToLocalStorage();
  },

  // Setters - Vehicle Properties
  setBodyPositionX: (value: number) => {
    set({ bodyPositionX: value });
    get().saveToLocalStorage();
  },
  setBodyPositionY: (value: number) => {
    set({ bodyPositionY: value });
    get().saveToLocalStorage();
  },
  setBodyPositionZ: (value: number) => {
    set({ bodyPositionZ: value });
    get().saveToLocalStorage();
  },
  setCastType: (value: CastType) => {
    set({ castType: value });
    get().saveToLocalStorage();
  },
  setWheelRadius: (value: number) => {
    set({ wheelRadius: value });
    get().saveToLocalStorage();
  },
  setWheelWidth: (value: number) => {
    set({ wheelWidth: value });
    get().saveToLocalStorage();
  },
  setHalfVehicleLength: (value: number) => {
    set({ halfVehicleLength: value });
    get().saveToLocalStorage();
  },
  setHalfVehicleWidth: (value: number) => {
    set({ halfVehicleWidth: value });
    get().saveToLocalStorage();
  },
  setHalfVehicleHeight: (value: number) => {
    set({ halfVehicleHeight: value });
    get().saveToLocalStorage();
  },

  // Persistence methods
  saveToLocalStorage: () => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const state = get();
      // Extract only the config values (exclude setters and persistence methods)
      const configToSave: Partial<VehicleConfigState> = {
        suspensionMinLength: state.suspensionMinLength,
        suspensionMaxLength: state.suspensionMaxLength,
        maxSteerAngle: state.maxSteerAngle,
        steeringAnimationDuration: state.steeringAnimationDuration,
        fourWheelDrive: state.fourWheelDrive,
        frontBackLimitedSlipRatio: state.frontBackLimitedSlipRatio,
        leftRightLimitedSlipRatio: state.leftRightLimitedSlipRatio,
        antiRollbar: state.antiRollbar,
        vehicleMass: state.vehicleMass,
        maxEngineTorque: state.maxEngineTorque,
        clutchStrength: state.clutchStrength,
        wheelFriction: state.wheelFriction,
        vehicleBodyFriction: state.vehicleBodyFriction,
        linearDamping: state.linearDamping,
        angularDamping: state.angularDamping,
        maxPitchRollAngle: state.maxPitchRollAngle,
        engineSoundBaseVolume: state.engineSoundBaseVolume,
        engineSoundMinPitch: state.engineSoundMinPitch,
        engineSoundMaxPitch: state.engineSoundMaxPitch,
        engineSoundMinVolume: state.engineSoundMinVolume,
        engineSoundMaxVolume: state.engineSoundMaxVolume,
        engineSoundSpeedFactor: state.engineSoundSpeedFactor,
        engineSoundAnimationDuration: state.engineSoundAnimationDuration,
        engineSoundAnimationEase: state.engineSoundAnimationEase,
        bodyPositionX: state.bodyPositionX,
        bodyPositionY: state.bodyPositionY,
        bodyPositionZ: state.bodyPositionZ,
        castType: state.castType,
        wheelRadius: state.wheelRadius,
        wheelWidth: state.wheelWidth,
        halfVehicleLength: state.halfVehicleLength,
        halfVehicleWidth: state.halfVehicleWidth,
        halfVehicleHeight: state.halfVehicleHeight,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configToSave));
    } catch (error) {
      console.error('Failed to save vehicle config to localStorage:', error);
    }
  },

  loadFromLocalStorage: () => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const saved = loadSavedConfig();
      if (saved) {
        set(saved);
      }
    } catch (error) {
      console.error('Failed to load vehicle config from localStorage:', error);
    }
  },
}));
