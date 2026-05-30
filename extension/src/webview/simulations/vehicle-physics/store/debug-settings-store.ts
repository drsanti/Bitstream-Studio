/**
 * Debug Settings Store
 * Manages debug visualization settings using Zustand with localStorage persistence
 */

import { create } from 'zustand';

export interface DebugSettingsState {
  // Debug mesh visibility - two groups
  showVehiclePartsDebug: boolean; // Vehicle body + wheels
  showPhysicsObjectsDebug: boolean; // Balls + floor + other physics objects

  // Vehicle Parts Debug parameters
  vehiclePartsDebugOpacity: number; // 0.0 - 1.0
  vehiclePartsDebugColor: string; // hex color

  // Physics Objects Debug parameters
  physicsObjectsDebugOpacity: number; // 0.0 - 1.0
  physicsObjectsDebugColor: string; // hex color

  // Setters
  setShowVehiclePartsDebug: (value: boolean) => void;
  setShowPhysicsObjectsDebug: (value: boolean) => void;
  setVehiclePartsDebugOpacity: (value: number) => void;
  setVehiclePartsDebugColor: (value: string) => void;
  setPhysicsObjectsDebugOpacity: (value: number) => void;
  setPhysicsObjectsDebugColor: (value: string) => void;

  // Persistence
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
}

const STORAGE_KEY = 'debug-settings-store';

// Helper function to get default values
const getDefaultValues = () => ({
  showVehiclePartsDebug: false,
  showPhysicsObjectsDebug: false,
  vehiclePartsDebugOpacity: 0.1,
  vehiclePartsDebugColor: '#00ff00', // Green
  physicsObjectsDebugOpacity: 0.5,
  physicsObjectsDebugColor: '#ff0000', // Red
});

// Load from localStorage on initialization
const loadSavedConfig = (): Partial<DebugSettingsState> | null => {
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
    const loaded: Partial<DebugSettingsState> = {};

    // Only load fields that exist in defaults (safety check)
    Object.keys(defaults).forEach((key) => {
      if (
        key in parsed &&
        typeof parsed[key] === typeof defaults[key as keyof typeof defaults]
      ) {
        loaded[key as keyof DebugSettingsState] = parsed[key];
      }
    });

    return Object.keys(loaded).length > 0 ? loaded : null;
  } catch (error) {
    console.warn(
      'Failed to load saved debug settings from localStorage:',
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

export const useDebugSettingsStore = create<DebugSettingsState>((set, get) => ({
  // Initial values (loaded from localStorage if available, otherwise defaults)
  ...initialState,

  // Setters
  setShowVehiclePartsDebug: (value: boolean) => {
    set({ showVehiclePartsDebug: value });
    get().saveToLocalStorage();
  },

  setShowPhysicsObjectsDebug: (value: boolean) => {
    set({ showPhysicsObjectsDebug: value });
    get().saveToLocalStorage();
  },

  setVehiclePartsDebugOpacity: (value: number) => {
    set({ vehiclePartsDebugOpacity: value });
    get().saveToLocalStorage();
  },

  setVehiclePartsDebugColor: (value: string) => {
    set({ vehiclePartsDebugColor: value });
    get().saveToLocalStorage();
  },

  setPhysicsObjectsDebugOpacity: (value: number) => {
    set({ physicsObjectsDebugOpacity: value });
    get().saveToLocalStorage();
  },

  setPhysicsObjectsDebugColor: (value: string) => {
    set({ physicsObjectsDebugColor: value });
    get().saveToLocalStorage();
  },

  // Persistence methods
  saveToLocalStorage: () => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const state = get();
      const configToSave: Partial<DebugSettingsState> = {
        showVehiclePartsDebug: state.showVehiclePartsDebug,
        showPhysicsObjectsDebug: state.showPhysicsObjectsDebug,
        vehiclePartsDebugOpacity: state.vehiclePartsDebugOpacity,
        vehiclePartsDebugColor: state.vehiclePartsDebugColor,
        physicsObjectsDebugOpacity: state.physicsObjectsDebugOpacity,
        physicsObjectsDebugColor: state.physicsObjectsDebugColor,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configToSave));
    } catch (error) {
      console.error('Failed to save debug settings to localStorage:', error);
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
      console.error('Failed to load debug settings from localStorage:', error);
    }
  },
}));
