import { useBitstreamWorkspaceModeStore } from "../../bitstream-app/state/bitstreamWorkspaceMode.store";
import {
  useLinkLifecycleBarInputs,
  useLinkLifecycleReadyFromStores,
} from "../hooks/useLinkLifecycleBarInputs";
import { LinkLifecycleStrip } from "./LinkLifecycleStrip";
import { ShellLinkTelemetryCluster } from "./ShellLinkTelemetryCluster";
import {
  SHELL_LINK_STATUS_FOOTER_PILL_CLASS,
  SHELL_LINK_STATUS_FOOTER_SLOT_CLASS,
} from "./shell-link-status-footer-ui";

/**
 * Floating footer: link lifecycle pills while setup runs; wire + FPS when link is ready.
 * Sensor Studio hides the footer once ready (metrics stay in the shell toolbar only).
 */
export function ShellLinkStatusFooter() {
  const workspace = useBitstreamWorkspaceModeStore((s) => s.workspace);
  const mergedWorkspaceChrome =
    workspace === "sensor-studio" || workspace === "sensor-telemetry";
  const studioToolbarOwnsMetrics = workspace === "sensor-studio";

  const lifecycleInputs = useLinkLifecycleBarInputs();
  const linkReady = useLinkLifecycleReadyFromStores();

  if (!mergedWorkspaceChrome) {
    return null;
  }

  if (linkReady && studioToolbarOwnsMetrics) {
    return null;
  }

  const showLifecycle = !linkReady;

  return (
    <div
      className={SHELL_LINK_STATUS_FOOTER_PILL_CLASS}
      role="status"
      aria-live="polite"
      aria-label={showLifecycle ? "Link setup progress" : "Telemetry link status"}
    >
      {showLifecycle ? (
        <LinkLifecycleStrip
          {...lifecycleInputs}
          wrapPills={false}
          showStatusText={false}
          showConnectionButton
          className={SHELL_LINK_STATUS_FOOTER_SLOT_CLASS}
        />
      ) : (
        <div className={`${SHELL_LINK_STATUS_FOOTER_SLOT_CLASS} justify-center`}>
          <ShellLinkTelemetryCluster />
        </div>
      )}
    </div>
  );
}
