import { create } from "zustand";

/**
 * Bitstream shell workspaces under {@link BitstreamAppMain}:
 * - **sensor-telemetry** — sensor configuration + live telemetry deck, URL default.
 * - **sensor-studio** — flow editor (`SensorStudioApp`), `?app=sensor-studio`.
 */
export type BitstreamWorkspaceId = "sensor-telemetry" | "sensor-studio";

function readBitstreamWorkspaceFromHost(): BitstreamWorkspaceId | null {
  if (typeof window === "undefined") {
    return null;
  }
  const host = window.TERNION_BITSTREAM_WORKSPACE;
  if (host === "sensor-studio" || host === "sensor-telemetry" || host === "telemetry") {
    return host;
  }
  return null;
}

export function readBitstreamWorkspaceFromUrl(): BitstreamWorkspaceId {
  const fromHost = readBitstreamWorkspaceFromHost();
  if (fromHost != null) {
    return fromHost;
  }
  if (typeof window === "undefined") {
    return "sensor-telemetry";
  }
  try {
    const app = new URLSearchParams(window.location.search).get("app");
    if (app === "sensor-studio") {
      return "sensor-studio";
    }
    if (app === "sensor-telemetry" || app === "bitstream" || app === "sensor-lab") {
      return "sensor-telemetry";
    }
  } catch {
    // ignore
  }
  return "sensor-telemetry";
}

/** Sync workspace to the URL (`?app=sensor-studio` or bitstream default). */
export function syncBitstreamWorkspaceToUrl(
  workspace: BitstreamWorkspaceId,
  usePushState: boolean,
): void {
  if (typeof window === "undefined") {
    return;
  }
  const url = new URL(window.location.href);
  url.searchParams.delete("launcher");
  if (workspace === "sensor-studio") {
    url.searchParams.set("app", "sensor-studio");
  } else {
    url.searchParams.set("app", "bitstream");
  }
  const next = `${url.pathname}${url.search}${url.hash}`;
  if (usePushState) {
    window.history.pushState({}, "", next);
  } else {
    window.history.replaceState({}, "", next);
  }
}

type BitstreamWorkspaceModeState = {
  workspace: BitstreamWorkspaceId;
  /** Updates workspace and syncs the URL (pushState so browser Back returns to the previous workspace). */
  setWorkspace: (next: BitstreamWorkspaceId) => void;
};

export const useBitstreamWorkspaceModeStore = create<BitstreamWorkspaceModeState>((set, get) => ({
  workspace: readBitstreamWorkspaceFromUrl(),
  setWorkspace: (next) => {
    if (get().workspace === next) {
      return;
    }
    set({ workspace: next });
    syncBitstreamWorkspaceToUrl(next, true);
  },
}));

/** Launcher / entry switch: set workspace before mounting {@link BitstreamAppMain}. */
export function primeBitstreamWorkspaceForEntry(workspace: BitstreamWorkspaceId): void {
  useBitstreamWorkspaceModeStore.setState({ workspace });
  syncBitstreamWorkspaceToUrl(workspace, false);
}
