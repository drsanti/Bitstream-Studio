import type { Scene3dInspectorPanelId } from "../node-inspector-ui-persistence";

const SCENE3D_PANEL_ADVANCED_KEYWORDS: Record<Scene3dInspectorPanelId, readonly string[]> = {
  model: ["url", "transform", "position", "rotation", "scale", "custom"],
  environment: ["yaw", "off strength", "fallback", "background color"],
  renderer: ["shadow map", "bias", "dpr", "clear color", "ortho", "normal bias", "antialias"],
  camera: ["transform", "target", "lookat", "look at", "position"],
  orbit: [
    "speed",
    "polar",
    "azimuth",
    "mouse",
    "touch",
    "binding",
    "key rotate",
    "auto rotate",
    "screen space",
    "zoom to cursor",
  ],
  lights: ["directional", "ambient color", "hemisphere"],
  helpers: ["divisions", "axes", "frustum", "directional helper", "grid size", "opacity"],
};

const SCENE3D_JSON_KEYWORDS = ["scene3d", "scene json", "scene config", "raw scene"];

function tokens(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

export function shouldExpandScene3dAdvancedTier(
  panelId: Scene3dInspectorPanelId,
  query: string,
): boolean {
  const toks = tokens(query);
  if (toks.length === 0) {
    return false;
  }
  const keys = SCENE3D_PANEL_ADVANCED_KEYWORDS[panelId];
  const hay = keys.join(" ");
  return toks.some((t) => hay.includes(t) || keys.some((k) => k.includes(t)));
}

export function shouldShowScene3dJsonEditor(query: string): boolean {
  const toks = tokens(query);
  if (toks.length === 0) {
    return true;
  }
  const hay = [...SCENE3D_JSON_KEYWORDS, "json", "raw"].join(" ");
  return toks.some((t) => hay.includes(t) || SCENE3D_JSON_KEYWORDS.some((k) => k.includes(t)));
}
