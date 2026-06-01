import type { ReactNode } from "react";
import type { WorkbenchLayoutMenuProps } from "../../../../ui/workbench/workbench-layout-menu.types";
import { StudioOverflowMenu } from "./StudioOverflowMenu";

export type StudioToolbarActionsProps = {
  onOpenDeviceSensorSettings?: () => void;
  onDuplicateSelection?: () => void;
  onDeleteSelection?: () => void;
  onSelectAllNodes?: () => void;
  onClearCanvasSelection?: () => void;
  onExportFlow: () => void;
  onImportFlowPick: () => void;
  /** @deprecated Pass `layoutMenuProps` to {@link StudioOverflowMenu} instead. */
  layoutMenu?: ReactNode;
  layoutMenuProps?: WorkbenchLayoutMenuProps | null;
};

/** @deprecated Prefer {@link StudioOverflowMenu} registered on the shell toolbar. */
export function StudioToolbarActions(props: StudioToolbarActionsProps) {
  const {
    onOpenDeviceSensorSettings,
    onDuplicateSelection,
    onDeleteSelection,
    onSelectAllNodes,
    onClearCanvasSelection,
    onExportFlow,
    onImportFlowPick,
    layoutMenuProps,
  } = props;

  return (
    <StudioOverflowMenu
      onOpenDeviceSensorSettings={onOpenDeviceSensorSettings}
      onDuplicateSelection={onDuplicateSelection}
      onDeleteSelection={onDeleteSelection}
      onSelectAllNodes={onSelectAllNodes}
      onClearCanvasSelection={onClearCanvasSelection}
      onExportFlow={onExportFlow}
      onImportFlowPick={onImportFlowPick}
      layoutMenuProps={layoutMenuProps}
    />
  );
}
