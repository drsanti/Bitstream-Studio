import { WorkspaceChromeBar } from "../../../../bitstream-shell/ui/WorkspaceChromeBar";
import { StudioToolbarActions, type StudioToolbarActionsProps } from "./StudioToolbarActions";

export type SensorStudioChromeBarProps = StudioToolbarActionsProps & {
  borderColor?: string;
};

/**
 * Merged Sensor Studio header: studio actions + telemetry FPS + link lifecycle
 * (replaces separate `BitstreamBootLifecycleBar` + `StudioToolbar` in Sensor Studio mode).
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
