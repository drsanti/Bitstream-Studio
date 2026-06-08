import { create } from "zustand";
import type { BitstreamWorkspaceHostId } from "../../../ternion-shell-host-message.js";
import { isViteDevMode } from "../../utils/isViteDevMode.js";

/**
 * Bitstream shell workspaces under {@link BitstreamAppMain}:
 * - **sensor-telemetry** — sensor configuration + live telemetry deck.
 * - **sensor-studio** — flow editor (`SensorStudioApp`).
 * - **presentation** — integrated training / slide deck (`PresentationWorkspace`).
 *
 * Tab selection is persisted in localStorage (no `?app=` URL routing).
 */
export type BitstreamWorkspaceId = "sensor-telemetry" | "sensor-studio" | "presentation";

const STORAGE_KEY = "bitstream-studio.workspace.v1";

/** Map host / legacy ids to store workspace ids. */
export function normalizeBitstreamWorkspaceId(
  value: BitstreamWorkspaceHostId | BitstreamWorkspaceId | string | null | undefined,
): BitstreamWorkspaceId | null
{
  if (value === "sensor-studio")
  {
    return "sensor-studio";
  }
  if (value === "presentation")
  {
    return "presentation";
  }
  if (
    value === "sensor-telemetry" ||
    value === "telemetry" ||
    value === "bitstream"
  )
  {
    return "sensor-telemetry";
  }
  return null;
}

function readBitstreamWorkspaceFromHost(): BitstreamWorkspaceId | null
{
  if (typeof window === "undefined")
  {
    return null;
  }
  const host = window.TERNION_BITSTREAM_WORKSPACE;
  return normalizeBitstreamWorkspaceId(host);
}

function readPersistedBitstreamWorkspace(): BitstreamWorkspaceId | null
{
  if (typeof window === "undefined")
  {
    return null;
  }
  try
  {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return normalizeBitstreamWorkspaceId(raw);
  }
  catch
  {
    return null;
  }
}

/** Dev landing sets `?workspace=` via {@link commitBitstreamLandingChoice}. */
function readBitstreamWorkspaceFromDevUrlParam(): BitstreamWorkspaceId | null
{
  if (typeof window === "undefined" || !isViteDevMode())
  {
    return null;
  }
  try
  {
    const params = new URLSearchParams(window.location.search);
    return normalizeBitstreamWorkspaceId(params.get("workspace"));
  }
  catch
  {
    return null;
  }
}

function persistBitstreamWorkspace(workspace: BitstreamWorkspaceId): void
{
  if (typeof window === "undefined")
  {
    return;
  }
  try
  {
    window.localStorage.setItem(STORAGE_KEY, workspace);
  }
  catch
  {
    // ignore quota / private mode
  }
}

/** Host inject → dev URL `workspace` → localStorage → default telemetry tab. */
export function readInitialBitstreamWorkspace(): BitstreamWorkspaceId
{
  const fromHost = readBitstreamWorkspaceFromHost();
  if (fromHost != null)
  {
    return fromHost;
  }
  const fromUrl = readBitstreamWorkspaceFromDevUrlParam();
  if (fromUrl != null)
  {
    return fromUrl;
  }
  const persisted = readPersistedBitstreamWorkspace();
  if (persisted != null)
  {
    return persisted;
  }
  return "sensor-telemetry";
}

/** @deprecated Use {@link readInitialBitstreamWorkspace}. */
export const readBitstreamWorkspaceFromUrl = readInitialBitstreamWorkspace;

type BitstreamWorkspaceModeState = {
  workspace: BitstreamWorkspaceId;
  /** Updates workspace and persists the last tab (toolbar / shortcuts). */
  setWorkspace: (next: BitstreamWorkspaceId) => void;
};

export const useBitstreamWorkspaceModeStore = create<BitstreamWorkspaceModeState>((set, get) => ({
  workspace: readInitialBitstreamWorkspace(),
  setWorkspace: (next) => {
    if (get().workspace === next)
    {
      return;
    }
    set({ workspace: next });
    persistBitstreamWorkspace(next);
  },
}));

/** Entry bootstrap: set workspace before mounting {@link BitstreamAppMain}. */
export function primeBitstreamWorkspaceForEntry(workspace: BitstreamWorkspaceId): void
{
  useBitstreamWorkspaceModeStore.setState({ workspace });
  persistBitstreamWorkspace(workspace);
}
