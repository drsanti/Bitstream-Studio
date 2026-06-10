import {
  createDefaultDiagram3dModelNode,
  defaultBmi270QuaternionRotation,
  defaultGyroRateEulerRotation,
} from "../runtime/diagram/diagram3dNodeMutations";
import { DEFAULT_SCENE_ENVIRONMENT, parseSceneV1, type SceneV1 } from "../schemas/scene.v1";
import { loadCourseScene, registerCourseScene } from "./sceneRegistry";
import { saveCourseScene } from "../maintainer/saveCourseScene";
import pilotBmiPcbSceneJson from "./pilot-bmi-pcb-orientation.scene.v1.json";

export type CourseSceneTemplate =
  | "blank"
  | "bmi-pcb"
  | "gyro-gimbal"
  | "axis-triad"
  | "simple-box";

export function courseSceneSourcePathForId(documentId: string): string {
  return `src/webview/course-studio/content/${documentId}.scene.v1.json`;
}

export function createBlankSceneV1(documentId: string, title = "New 3D scene"): SceneV1 {
  return parseSceneV1({
    version: 1,
    id: documentId,
    title,
    settings: { ...DEFAULT_SCENE_ENVIRONMENT },
    nodes: [],
  });
}

export function createBmiPcbSceneV1(documentId: string, title = "PCB orientation"): SceneV1 {
  return parseSceneV1({
    version: 1,
    id: documentId,
    title,
    camera: { position: [3, 2.5, 4], fov: 45 },
    settings: { ...DEFAULT_SCENE_ENVIRONMENT },
    nodes: [
      {
        ...createDefaultDiagram3dModelNode("pcb"),
        rotation: defaultBmi270QuaternionRotation(),
      },
    ],
  });
}

export function createGyroGimbalSceneV1(documentId: string, title = "Gyro gimbal"): SceneV1 {
  return parseSceneV1({
    version: 1,
    id: documentId,
    title,
    camera: { position: [0, 0.4, 5], fov: 40 },
    settings: { ...DEFAULT_SCENE_ENVIRONMENT },
    nodes: [
      {
        id: "gimbal",
        type: "model",
        modelId: "procedural-gyro-gimbal",
        rotation: defaultGyroRateEulerRotation(),
      },
    ],
  });
}

export function createAxisTriadSceneV1(documentId: string, title = "Axis triad"): SceneV1 {
  return parseSceneV1({
    version: 1,
    id: documentId,
    title,
    camera: { position: [2.2, 1.8, 2.8], fov: 42 },
    settings: { ...DEFAULT_SCENE_ENVIRONMENT },
    nodes: [
      {
        id: "triad",
        type: "model",
        modelId: "procedural-axis-triad",
      },
    ],
  });
}

export function createSimpleBoxSceneV1(documentId: string, title = "Simple box"): SceneV1 {
  return parseSceneV1({
    version: 1,
    id: documentId,
    title,
    camera: { position: [2.5, 2, 3.5], fov: 45 },
    settings: { ...DEFAULT_SCENE_ENVIRONMENT },
    nodes: [
      {
        id: "box",
        type: "model",
        modelId: "procedural-box",
      },
    ],
  });
}

export function duplicateSceneV1(source: SceneV1, newId: string, title?: string): SceneV1 {
  const cloned = parseSceneV1(JSON.parse(JSON.stringify(source)));
  cloned.id = newId;
  if (title != null) {
    cloned.title = title;
  } else if (source.title != null) {
    cloned.title = `${source.title} (copy)`;
  }
  return cloned;
}

let sceneIdSequence = 0;

function nextSceneDocumentId(): string {
  sceneIdSequence += 1;
  return `scene-${Date.now().toString(36)}-${sceneIdSequence}`;
}

export function buildCourseSceneFromTemplate(template: CourseSceneTemplate): {
  documentId: string;
  scene: SceneV1;
  sourcePath: string;
} {
  const documentId = nextSceneDocumentId();
  let scene: SceneV1;
  switch (template) {
    case "blank":
      scene = createBlankSceneV1(documentId);
      break;
    case "bmi-pcb":
      scene = duplicateSceneV1(parseSceneV1(pilotBmiPcbSceneJson), documentId, "PCB orientation");
      break;
    case "gyro-gimbal":
      scene = createGyroGimbalSceneV1(documentId);
      break;
    case "axis-triad":
      scene = createAxisTriadSceneV1(documentId);
      break;
    case "simple-box":
      scene = createSimpleBoxSceneV1(documentId);
      break;
  }
  const sourcePath = courseSceneSourcePathForId(documentId);
  return { documentId, scene, sourcePath };
}

export function registerNewCourseScene(template: CourseSceneTemplate): {
  documentId: string;
  scene: SceneV1;
  sourcePath: string;
} {
  const built = buildCourseSceneFromTemplate(template);
  registerCourseScene(built.scene, built.sourcePath);
  return built;
}

export async function persistNewCourseSceneToDev(built: {
  sourcePath: string;
  scene: SceneV1;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!import.meta.env.DEV) {
    return { ok: true };
  }
  try {
    return await saveCourseScene(built.sourcePath, built.scene);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/** Register a new scene in memory only — add the page block before dev disk persist. */
export function prepareNewCourseScene(
  template: CourseSceneTemplate = "blank",
): { documentId: string; scene: SceneV1; sourcePath: string } {
  return registerNewCourseScene(template);
}

export function loadBundledSceneTemplate(template: CourseSceneTemplate): SceneV1 | null {
  if (template === "bmi-pcb") {
    return loadCourseScene("pilot-bmi-pcb-orientation") ?? parseSceneV1(pilotBmiPcbSceneJson);
  }
  return null;
}
