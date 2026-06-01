import type {
  WorkbenchLayoutPreset,
  WorkbenchLayoutSnapshotV1,
  WorkbenchStartupPreference,
} from "./workbench-layout-library";

export type WorkbenchLayoutMenuProps = {
  presets: readonly WorkbenchLayoutPreset[];
  namedLayouts: readonly WorkbenchLayoutSnapshotV1[];
  startupPreference: WorkbenchStartupPreference;
  onLoadPreset: (presetId: string) => void;
  onLoadNamed: (layoutId: string) => void;
  onSaveAs: () => void;
  onManage: () => void;
  onExportCurrent: () => void;
  onImport: () => void;
  onReset: () => void;
};
