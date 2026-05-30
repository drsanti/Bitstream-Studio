import type { T3DQuickSceneInfo } from "@ternion/t3d";
import { AppQsSerialMonitor } from "./ui/AppQsSerialMonitor";

export const qsSerialMonitorScene: T3DQuickSceneInfo = {
  id: "ext-serial-monitor",
  name: "Serial Monitor",
  description:
    "Serial terminal via WebSocket bridge (read/write) — same client in browser and VS Code webview",
  modelPath: "",
  applicationComponent: AppQsSerialMonitor,
  requiresPhysics: false,
};

/** Scenes for `registerQuickScenes` / `extensionQuickScenes`. */
export const qsSerialMonitorQuickScenes: T3DQuickSceneInfo[] = [
  qsSerialMonitorScene,
];
