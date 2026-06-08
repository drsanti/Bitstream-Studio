import { z } from "zod";

export const course3dSceneIdSchema = z.enum([
  "bmi-pcb-orientation",
  "axis-triad",
  "bmi-gyro-gimbal",
]);

export type Course3dSceneId = z.infer<typeof course3dSceneIdSchema>;

export const DEFAULT_COURSE_3D_SCENE_ID: Course3dSceneId = "bmi-pcb-orientation";
