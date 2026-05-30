/** localStorage keys for Project 4 floating `TRNWindow` geometry (`persistRectStorageKey`). */
export const PROJECT4_WINDOW_RECT_ASSISTANT = "ternion.project4.windowRect.assistant.v1";
export const PROJECT4_WINDOW_RECT_COPILOT_HELP = "ternion.project4.windowRect.copilotHelp.v1";
export const PROJECT4_WINDOW_RECT_GRAPHICS_SETUP = "ternion.project4.windowRect.graphicsSetup.v1";
export const PROJECT4_WINDOW_RECT_TWIN_VIEWER_SETUP = "ternion.project4.windowRect.twinViewerSetup.v1";
export const PROJECT4_WINDOW_RECT_HARDWARE_SETUP = "ternion.project4.windowRect.hardwareSetup.v1";
export const PROJECT4_WINDOW_RECT_SETTINGS = "ternion.project4.windowRect.settings.v1";

export const PROJECT4_WINDOW_RECT_KEYS_ALL = [
  PROJECT4_WINDOW_RECT_ASSISTANT,
  PROJECT4_WINDOW_RECT_COPILOT_HELP,
  PROJECT4_WINDOW_RECT_GRAPHICS_SETUP,
  PROJECT4_WINDOW_RECT_TWIN_VIEWER_SETUP,
  PROJECT4_WINDOW_RECT_HARDWARE_SETUP,
  PROJECT4_WINDOW_RECT_SETTINGS,
] as const;

const VISIBILITY_KEY = "ternion.project4.overlayWindows.visibility.v1";

export type Project4OverlayWindowsVisibilityV1 = {
  assistantOpen: boolean;
  copilotHelpOpen: boolean;
  graphicsSetupOpen: boolean;
  twinViewerSetupOpen: boolean;
  hardwareSetupOpen: boolean;
  settingsOpen: boolean;
};

const DEFAULT_VISIBILITY: Project4OverlayWindowsVisibilityV1 = {
  assistantOpen: true,
  copilotHelpOpen: false,
  graphicsSetupOpen: false,
  twinViewerSetupOpen: false,
  hardwareSetupOpen: false,
  settingsOpen: false,
};

function readBool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}

export function loadProject4OverlayWindowsVisibility(): Project4OverlayWindowsVisibilityV1 {
  if (typeof localStorage === "undefined") {
    return { ...DEFAULT_VISIBILITY };
  }
  try {
    const raw = localStorage.getItem(VISIBILITY_KEY);
    if (raw == null || raw.length === 0) {
      return { ...DEFAULT_VISIBILITY };
    }
    const o = JSON.parse(raw) as Record<string, unknown>;
    return {
      assistantOpen: readBool(o.assistantOpen, DEFAULT_VISIBILITY.assistantOpen),
      copilotHelpOpen: readBool(o.copilotHelpOpen, DEFAULT_VISIBILITY.copilotHelpOpen),
      graphicsSetupOpen: readBool(o.graphicsSetupOpen, DEFAULT_VISIBILITY.graphicsSetupOpen),
      twinViewerSetupOpen: readBool(o.twinViewerSetupOpen, DEFAULT_VISIBILITY.twinViewerSetupOpen),
      hardwareSetupOpen: readBool(o.hardwareSetupOpen, DEFAULT_VISIBILITY.hardwareSetupOpen),
      settingsOpen: readBool(o.settingsOpen, DEFAULT_VISIBILITY.settingsOpen),
    };
  } catch {
    return { ...DEFAULT_VISIBILITY };
  }
}

/** Defaults after HUD “reset floating windows”: Copilot open, Help and setup dialogs closed. */
export function getDefaultProject4OverlayWindowsVisibility(): Project4OverlayWindowsVisibilityV1 {
  return { ...DEFAULT_VISIBILITY };
}

export function saveProject4OverlayWindowsVisibility(state: Project4OverlayWindowsVisibilityV1): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  try {
    localStorage.setItem(VISIBILITY_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

/** Clears saved rectangles so next mount uses each window’s `initialRect`. */
export function clearPersistedProject4WindowRects(): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  try {
    for (const key of PROJECT4_WINDOW_RECT_KEYS_ALL) {
      localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}
