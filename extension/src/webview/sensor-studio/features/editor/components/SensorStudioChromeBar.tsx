import { WorkspaceChromeBar } from "../../../../bitstream-shell/ui/WorkspaceChromeBar";
import { StudioToolbarActions, type StudioToolbarActionsProps } from "./StudioToolbarActions";

export type SensorStudioChromeBarProps = StudioToolbarActionsProps & {
  borderColor?: string;
};

/**
 * @deprecated Workspace chrome moved to `BitstreamMainToolbar` via `StudioOverflowMenu`
 * Studio overflow on flow canvas; shell menu via `BitstreamHeaderMenuPanel`. Legacy imports only.
 */
export function SensorStudioChromeBar(props: SensorStudioChromeBarProps) {
  const { borderColor, ...actionsProps } = props;

  return (
    <WorkspaceChromeBar
      title="Sensor Studio"
      borderColor={borderColor}
      actions={<StudioToolbarActions {...actionsProps} />}
    />
  );
}
