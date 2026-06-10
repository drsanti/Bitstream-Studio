import { create } from "zustand";
import type { BitstreamWorkspaceHostId } from "../../../ternion-shell-host-message.js";
import { syncDevBitstreamWorkspaceUrl } from "../../landing/bitstreamLandingNav.js";
import { isViteDevMode } from "../../utils/isViteDevMode.js";

/**
 * Bitstream shell workspaces under {@link BitstreamAppMain}:
 * - **sensor-telemetry** — sensor configuration + live telemetry deck.
 * - **sensor-studio** — flow editor (`SensorStudioApp`).
 * - **presentation** — legacy v1 slide deck (VS Code side panel only; not in shell toolbar).
 * - **course-studio** — alive documents v2 (`CourseStudioWorkspace`).
 *
 * Tab selection is persisted in localStorage. In Vite dev, toolbar / shortcuts also sync
 * `?app=bitstream&workspace=` via {@link syncDevBitstreamWorkspaceUrl}.
 */
export type BitstreamWorkspaceId =
  | "sensor-telemetry"
  | "sensor-studio"
  | "presentation"
  | "course-studio";

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
  if (value === "course-studio")
  {
    return "course-studio";
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
    const normalized = normalizeBitstreamWorkspaceId(raw);
    if (normalized === "presentation")
    {
      return "course-studio";
    }
    return normalized;
  }
  catch
  {
    return null;
  }
}

/** Dev URL `?workspace=` — read on boot; written by {@link syncDevBitstreamWorkspaceUrl}. */
function readBitstreamWorkspaceFromDevUrlParam(): BitstreamWorkspaceId | null
{
  if (typeof window === "undefined" || !isViteDevMode())
  {
    return null;
  }
  try
  {
    const params = new URLSearchParams(window.location.search);
    const normalized = normalizeBitstreamWorkspaceId(params.get("workspace"));
    if (normalized === "presentation")
    {
      return "course-studio";
    }
    return normalized;
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
    const resolved = next === "presentation" ? "course-studio" : next;
    if (get().workspace === resolved)
    {
      return;
    }
    set({ workspace: resolved });
    persistBitstreamWorkspace(resolved);
    syncDevBitstreamWorkspaceUrl(resolved);
  },
}));

/** Entry bootstrap: set workspace before mounting {@link BitstreamAppMain}. */
export function primeBitstreamWorkspaceForEntry(workspace: BitstreamWorkspaceId): void
{
  useBitstreamWorkspaceModeStore.setState({ workspace });
  persistBitstreamWorkspace(workspace);
}
