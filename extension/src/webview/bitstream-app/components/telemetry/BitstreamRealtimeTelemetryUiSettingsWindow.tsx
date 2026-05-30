import { RealtimeUiSettingsForm } from "./RealtimeUiSettingsForm.js";

/**
 * Content for the hamburger “Realtime telemetry UI” window (scrollable shell is on {@link TRNWindow}).
 */
export function BitstreamRealtimeTelemetryUiSettingsWindow() {
  return (
    <div className="min-h-0 overflow-y-auto bg-black/30 p-2">
      <div className="space-y-2 min-h-0">
        <RealtimeUiSettingsForm section="advanced" />
      </div>
    </div>
  );
}
