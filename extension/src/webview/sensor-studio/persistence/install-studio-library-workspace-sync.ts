import { registerStudioLibraryWorkspacePush } from "./studio-library-workspace-notify";
import {
  handleStudioLibraryWorkspaceHostMessage,
  requestStudioLibraryWorkspacePull,
  serializeStudioLibraryWorkspaceMirror,
  useStudioLibraryWorkspaceStore,
  STUDIO_LIBRARY_WORKSPACE_MSG_PUSH,
} from "./studio-library-workspace-session";

export function installStudioLibraryWorkspaceSync(): () => void {
  const w = window as Window & { __VSCODE_API__?: { postMessage: (m: unknown) => void } };
  const vscode = w.__VSCODE_API__;
  if (!vscode?.postMessage) {
    useStudioLibraryWorkspaceStore.getState().setUnavailable();
    return () => {};
  }

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let lastPushed = "";

  const flushPush = (): void => {
    const next = serializeStudioLibraryWorkspaceMirror();
    if (next === lastPushed) {
      return;
    }
    lastPushed = next;
    vscode.postMessage({ type: STUDIO_LIBRARY_WORKSPACE_MSG_PUSH, configJson: next });
  };

  registerStudioLibraryWorkspacePush(() => {
    if (debounceTimer != null) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      flushPush();
    }, 520);
  });

  const onMessage = (event: MessageEvent): void => {
    if (!handleStudioLibraryWorkspaceHostMessage(event.data)) {
      return;
    }
    lastPushed = serializeStudioLibraryWorkspaceMirror();
  };

  window.addEventListener("message", onMessage);
  requestStudioLibraryWorkspacePull();

  return () => {
    registerStudioLibraryWorkspacePush(() => {});
    window.removeEventListener("message", onMessage);
    if (debounceTimer != null) {
      clearTimeout(debounceTimer);
    }
  };
}
