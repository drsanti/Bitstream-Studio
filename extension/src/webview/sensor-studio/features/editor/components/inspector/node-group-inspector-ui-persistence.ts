const KEY = "ternion.sensor-studio.nodeGroupInspector.activeTab.v1";

export type NodeGroupInspectorTab = "interface" | "group";

export function readStoredNodeGroupInspectorTab(): NodeGroupInspectorTab {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === "interface" || raw === "group") {
      return raw;
    }
  } catch {
    /* ignore */
  }
  return "interface";
}

export function writeStoredNodeGroupInspectorTab(tab: NodeGroupInspectorTab): void {
  try {
    localStorage.setItem(KEY, tab);
  } catch {
    /* ignore */
  }
}
