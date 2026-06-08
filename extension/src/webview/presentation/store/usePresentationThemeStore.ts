import { create } from "zustand";
import type { PresentationThemeMode } from "../design/theme";

const STORAGE_KEY = "bitstream-studio.presentation.theme.v1";

function readPersistedTheme(): PresentationThemeMode {
  if (typeof window === "undefined") {
    return "dark";
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function persistTheme(mode: PresentationThemeMode): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // ignore
  }
}

type PresentationThemeState = {
  theme: PresentationThemeMode;
  toggle: () => void;
  set: (mode: PresentationThemeMode) => void;
};

export const usePresentationThemeStore = create<PresentationThemeState>((set, get) => ({
  theme: readPersistedTheme(),
  toggle: () => {
    const next: PresentationThemeMode = get().theme === "dark" ? "light" : "dark";
    persistTheme(next);
    set({ theme: next });
  },
  set: (mode) => {
    persistTheme(mode);
    set({ theme: mode });
  },
}));
