import type { Course3dSceneId } from "../schemas/course3dScene";

export type Course3dSceneCatalogEntry = {
  id: Course3dSceneId;
  label: string;
  /** Scene reads live BMI270 via `presentationBmi270FrameRef`. */
  liveBinding: boolean;
};

export const COURSE_3D_SCENE_CATALOG: readonly Course3dSceneCatalogEntry[] = [
  {
    id: "bmi-pcb-orientation",
    label: "BMI270 PCB orientation",
    liveBinding: true,
  },
  {
    id: "axis-triad",
    label: "Axis triad (static)",
    liveBinding: false,
  },
  {
    id: "bmi-gyro-gimbal",
    label: "Gyro gimbal",
    liveBinding: true,
  },
] as const;

export function course3dSceneLabel(sceneId: Course3dSceneId): string {
  return COURSE_3D_SCENE_CATALOG.find((entry) => entry.id === sceneId)?.label ?? sceneId;
}

export function course3dSceneUsesLiveBinding(sceneId: Course3dSceneId): boolean {
  return COURSE_3D_SCENE_CATALOG.find((entry) => entry.id === sceneId)?.liveBinding === true;
}
