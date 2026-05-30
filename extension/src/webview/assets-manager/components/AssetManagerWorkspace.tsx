import type { GlobalDirectoriesPanelProps } from "./global-directories/GlobalDirectoriesPanel.js";
import { GlobalDirectoriesPanel } from "./global-directories/GlobalDirectoriesPanel.js";

/**
 * In-window body for Asset Manager: hosts feature panels (starting with Global Directories).
 */
export function AssetManagerWorkspace(props: GlobalDirectoriesPanelProps) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-1">
      <GlobalDirectoriesPanel {...props} />
    </div>
  );
}
