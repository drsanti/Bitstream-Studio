import { create } from "zustand";
import { isVsCodeExtensionWebview } from "../../isVsCodeExtensionWebview";
import { useFlowEditorStore } from "../features/editor/store/flow-editor.store";
import {
  buildStudioLibraryWorkspaceMirror,
  isStudioLibraryWorkspaceMirrorEmpty,
  mergeStudioLibraryWorkspaceMirror,
  parseStudioLibraryWorkspaceMirror,
} from "./studio-library-workspace-mirror";
import { readPersistedFlowPresetLibrary, writePersistedFlowPresetLibrary } from "./flow-preset-library.repository";
import { readPersistedNodeGroupLibrary, writePersistedNodeGroupLibrary } from "./node-group-library.repository";

export const STUDIO_LIBRARY_WORKSPACE_MSG_PULL = "studio-library-workspace-pull" as const;
export const STUDIO_LIBRARY_WORKSPACE_MSG_PUSH = "studio-library-workspace-push" as const;
export const STUDIO_LIBRARY_WORKSPACE_MSG_RESP = "studio-library-workspace-response" as const;

export type StudioLibraryWorkspaceStatus =
  | "unavailable"
  | "no-folder"
  | "ready"
  | "syncing"
  | "error";

type StudioLibraryWorkspaceSessionStore = {
  status: StudioLibraryWorkspaceStatus;
  workspacePath: string | null;
  lastSyncedAtMs: number | null;
  lastError: string | null;
  setFromHostResponse: (args: {
    configJson: string | null;
    workspacePath?: string | null;
    error?: string | null;
  }) => void;
  setSyncing: (syncing: boolean) => void;
  setUnavailable: () => void;
};

export const useStudioLibraryWorkspaceStore = create<StudioLibraryWorkspaceSessionStore>((set) => ({
  status: isVsCodeExtensionWebview() ? "syncing" : "unavailable",
  workspacePath: null,
  lastSyncedAtMs: null,
  lastError: null,
  setUnavailable: () => {
    set({
      status: "unavailable",
      workspacePath: null,
      lastError: null,
    });
  },
  setSyncing: (syncing) => {
    set((state) => ({
      status: syncing ? "syncing" : state.workspacePath != null ? "ready" : state.status,
    }));
  },
  setFromHostResponse: ({ configJson, workspacePath, error }) => {
    if (typeof error === "string" && error.length > 0) {
      set({
        status: "error",
        lastError: error,
        workspacePath: workspacePath ?? null,
      });
      return;
    }
    if (workspacePath == null || workspacePath.trim().length === 0) {
      set({
        status: "no-folder",
        workspacePath: null,
        lastError: null,
      });
      return;
    }
    if (typeof configJson === "string" && configJson.trim().length > 0) {
      applyWorkspaceMirrorToLocal(configJson);
    }
    set({
      status: "ready",
      workspacePath,
      lastSyncedAtMs: Date.now(),
      lastError: null,
    });
  },
}));

function vscodeApi(): { postMessage: (m: unknown) => void } | null {
  if (!isVsCodeExtensionWebview()) {
    return null;
  }
  const w = window as Window & { __VSCODE_API__?: { postMessage: (m: unknown) => void } };
  return w.__VSCODE_API__?.postMessage != null ? w.__VSCODE_API__! : null;
}

function applyWorkspaceMirrorToLocal(configJson: string): boolean {
  const mirror = parseStudioLibraryWorkspaceMirror(configJson);
  if (mirror == null || isStudioLibraryWorkspaceMirrorEmpty(mirror)) {
    return false;
  }
  const merged = mergeStudioLibraryWorkspaceMirror({
    localFlows: readPersistedFlowPresetLibrary(),
    localGroups: readPersistedNodeGroupLibrary(),
    mirror,
  });
  writePersistedFlowPresetLibrary(merged.flowPresets);
  writePersistedNodeGroupLibrary(merged.groupAssets);
  useFlowEditorStore.setState({
    flowPresetLibrary: merged.flowPresets,
    nodeGroupLibrary: merged.groupAssets,
  });
  return true;
}

export function serializeStudioLibraryWorkspaceMirror(): string {
  const state = useFlowEditorStore.getState();
  return JSON.stringify(
    buildStudioLibraryWorkspaceMirror({
      flowPresets: state.flowPresetLibrary,
      groupAssets: state.nodeGroupLibrary,
    }),
  );
}

export function requestStudioLibraryWorkspacePull(): void {
  const api = vscodeApi();
  if (api == null) {
    useStudioLibraryWorkspaceStore.getState().setUnavailable();
    return;
  }
  api.postMessage({ type: STUDIO_LIBRARY_WORKSPACE_MSG_PULL });
}

export function requestStudioLibraryWorkspacePushNow(): void {
  const api = vscodeApi();
  if (api == null) {
    return;
  }
  api.postMessage({
    type: STUDIO_LIBRARY_WORKSPACE_MSG_PUSH,
    configJson: serializeStudioLibraryWorkspaceMirror(),
  });
  useStudioLibraryWorkspaceStore.setState({
    lastSyncedAtMs: Date.now(),
    lastError: null,
    status:
      useStudioLibraryWorkspaceStore.getState().workspacePath != null ? "ready" : "syncing",
  });
}

export async function syncStudioLibraryWorkspaceNow(): Promise<void> {
  const api = vscodeApi();
  if (api == null) {
    useStudioLibraryWorkspaceStore.getState().setUnavailable();
    return;
  }
  useStudioLibraryWorkspaceStore.getState().setSyncing(true);
  requestStudioLibraryWorkspacePull();
  await new Promise((resolve) => window.setTimeout(resolve, 280));
  requestStudioLibraryWorkspacePushNow();
  useStudioLibraryWorkspaceStore.getState().setSyncing(false);
}

export function handleStudioLibraryWorkspaceHostMessage(data: unknown): boolean {
  if (data == null || typeof data !== "object") {
    return false;
  }
  const row = data as {
    type?: string;
    configJson?: string | null;
    workspacePath?: string | null;
    error?: string | null;
  };
  if (row.type !== STUDIO_LIBRARY_WORKSPACE_MSG_RESP) {
    return false;
  }
  useStudioLibraryWorkspaceStore.getState().setFromHostResponse({
    configJson: row.configJson ?? null,
    workspacePath: row.workspacePath ?? null,
    error: row.error ?? null,
  });
  return true;
}
