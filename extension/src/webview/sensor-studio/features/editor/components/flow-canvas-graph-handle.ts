import type { ScreenPoint } from "../keyboard/resolve-add-node-menu-anchor";

export type FlowCanvasGraphHandle = {
  resolveAddNodeMenuAnchor: () => ScreenPoint;
  isAddNodeMenuOpen: () => boolean;
  closeAddNodeMenu: () => void;
  openAddNodeMenuAt: (anchor: ScreenPoint) => void;
  toggleAddNodeMenu: () => void;
  /** When exactly one `studio-node-group` is selected, returns its subgraph id for Tab drill-in. */
  getSelectedNodeGroupId: () => string | null;
};
