/**
 * Camera Settings Store
 * Manages camera settings state using Zustand with localStorage persistence
 */

import { create } from 'zustand';

export interface CameraSettingsState {
  // Camera settings
  fov: number;
  width: number;
  height: number;
  targetFps: number;
  positionOffset: { x: number; y: number; z: number };
  lookAtOffset: { x: number; y: number; z: number };
  showHelper: boolean;

  // Setters
  setFov: (value: number) => void;
  setSize: (width: number, height: number) => void;
  setTargetFps: (value: number) => void;
  setPositionOffset: (offset: { x: number; y: number; z: number }) => void;
  setLookAtOffset: (offset: { x: number; y: number; z: number }) => void;
  setShowHelper: (value: boolean) => void;

  // Persistence
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
}

const STORAGE_KEY = 'camera-settings-store';

// Helper function to get default values
const getDefaultValues = () => ({
  fov: 75,
  width: 512,
  height: 512,
  targetFps: 30,
  positionOffset: { x: 0, y: 1, z: 2 },
  lookAtOffset: { x: 0, y: 0, z: 5 },
  showHelper: true,
});

// Load from localStorage on initialization
const loadSavedConfig = (): Partial<CameraSettingsState> | null => {
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
    const loaded: Partial<CameraSettingsState> = {};

    // Only load fields that exist in defaults (safety check)
    Object.keys(defaults).forEach((key) => {
      if (
        key in parsed &&
        typeof parsed[key] === typeof defaults[key as keyof typeof defaults]
      ) {
        // Special handling for nested objects
        if (key === 'positionOffset' || key === 'lookAtOffset') {
          const parsedValue = parsed[key];
          if (
            parsedValue &&
            typeof parsedValue === 'object' &&
            'x' in parsedValue &&
            'y' in parsedValue &&
            'z' in parsedValue
          ) {
            loaded[key as keyof CameraSettingsState] = parsedValue;
          }
        } else {
          loaded[key as keyof CameraSettingsState] = parsed[key];
        }
      }
    });

    return Object.keys(loaded).length > 0 ? loaded : null;
  } catch (error) {
    console.warn(
      'Failed to load saved camera settings from localStorage:',
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

export const useCameraSettingsStore = create<CameraSettingsState>((set, get) => ({
  // Initial values (loaded from localStorage if available, otherwise defaults)
  ...initialState,

  // Setters
  setFov: (value: number) => {
    set({ fov: value });
    get().saveToLocalStorage();
  },

  setSize: (width: number, height: number) => {
    set({ width, height });
    get().saveToLocalStorage();
  },

  setTargetFps: (value: number) => {
    set({ targetFps: value });
    get().saveToLocalStorage();
  },

  setPositionOffset: (offset: { x: number; y: number; z: number }) => {
    set({ positionOffset: offset });
    get().saveToLocalStorage();
  },

  setLookAtOffset: (offset: { x: number; y: number; z: number }) => {
    set({ lookAtOffset: offset });
    get().saveToLocalStorage();
  },

  setShowHelper: (value: boolean) => {
    set({ showHelper: value });
    get().saveToLocalStorage();
  },

  // Persistence methods
  saveToLocalStorage: () => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const state = get();
      const configToSave: Partial<CameraSettingsState> = {
        fov: state.fov,
        width: state.width,
        height: state.height,
        targetFps: state.targetFps,
        positionOffset: state.positionOffset,
        lookAtOffset: state.lookAtOffset,
        showHelper: state.showHelper,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configToSave));
    } catch (error) {
      console.error('Failed to save camera settings to localStorage:', error);
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
      console.error('Failed to load camera settings from localStorage:', error);
    }
  },
}));

