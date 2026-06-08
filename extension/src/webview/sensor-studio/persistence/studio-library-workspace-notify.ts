let schedulePush: (() => void) | null = null;

export function registerStudioLibraryWorkspacePush(fn: () => void): void {
  schedulePush = fn;
}

export function notifyStudioLibraryWorkspaceChanged(): void {
  schedulePush?.();
}
