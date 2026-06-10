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

let snapshot: CourseScene3dDebugSnapshot | null = null;
const listeners = new Set<() => void>();

export function setCourseScene3dDebugSnapshot(next: CourseScene3dDebugSnapshot): void {
  snapshot = next;
  for (const listener of listeners) {
    listener();
  }
}

export function getCourseScene3dDebugSnapshot(): CourseScene3dDebugSnapshot | null {
  return snapshot;
}

export function subscribeCourseScene3dDebug(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isCourseScene3dDebugHudEnabled(): boolean {
  return import.meta.env.DEV;
}
