export type CourseScene3dDebugSnapshot = {
  updatedAtMs: number;
  hostW: number;
  hostH: number;
  bufferW: number;
  bufferH: number;
  r3fW: number;
  r3fH: number;
  dpr: number;
  cameraType: string;
  cameraPos: string;
  cameraFovOrZoom: string;
  cameraForward: string;
  orbitTarget: string;
  controlsEnabled: boolean;
  projection: string;
  sceneChildren: number;
  meshCount: number;
  lightCount: number;
  background: string;
  backdropMode: string;
  hasEnvironment: boolean;
  modelCount: number;
  rootCount: number;
  frameCount: number;
  contextLost: boolean;
  frameloop: string;
  designTime: boolean;
  canvasCount: number;
  canvasCss: string;
  canvasOpacity: string;
};

const snapshots = new Map<string, CourseScene3dDebugSnapshot>();
const listenersByScene = new Map<string, Set<() => void>>();

function notifySceneListeners(sceneId: string): void {
  const listeners = listenersByScene.get(sceneId);
  if (listeners == null) {
    return;
  }
  for (const listener of listeners) {
    listener();
  }
}

export function setCourseScene3dDebugSnapshot(
  sceneId: string,
  next: CourseScene3dDebugSnapshot,
): void {
  snapshots.set(sceneId, next);
  notifySceneListeners(sceneId);
}

export function clearCourseScene3dDebugSnapshot(sceneId: string): void {
  snapshots.delete(sceneId);
  notifySceneListeners(sceneId);
}

export function getCourseScene3dDebugSnapshot(sceneId: string): CourseScene3dDebugSnapshot | null {
  return snapshots.get(sceneId) ?? null;
}

export function subscribeCourseScene3dDebug(sceneId: string, listener: () => void): () => void {
  let listeners = listenersByScene.get(sceneId);
  if (listeners == null) {
    listeners = new Set();
    listenersByScene.set(sceneId, listeners);
  }
  listeners.add(listener);
  return () => {
    listeners!.delete(listener);
    if (listeners!.size === 0) {
      listenersByScene.delete(sceneId);
    }
  };
}

export function isCourseScene3dDebugHudEnabled(): boolean {
  return import.meta.env.DEV;
}
