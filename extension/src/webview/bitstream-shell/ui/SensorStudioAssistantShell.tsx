import type { RefObject } from "react";
import { useEffect } from "react";
import { configService } from "../../sensor-studio/core/config/config-service";
import { SensorStudioAssistantPanel } from "../../sensor-studio/features/assistant/SensorStudioAssistantPanel";
import { useSensorStudioAssistantUiStore } from "../../sensor-studio/state/sensorStudioAssistantUi.store";

/**
 * Renders the Bitstream AI assistant panel (shared Bitstream session) from the shell: toolbar, hamburger menu, Alt+A.
 */
export function SensorStudioAssistantShell(props: {
  workspaceBoundsRef: RefObject<HTMLElement | null>;
  onOpenSystemDiagnostics?: () => void;
})
{
  const { workspaceBoundsRef, onOpenSystemDiagnostics } = props;

  const assistantOpen = useSensorStudioAssistantUiStore((s) => s.assistantOpen);
  const assistantLayoutMode = useSensorStudioAssistantUiStore((s) => s.assistantLayoutMode);
  const setAssistantLayoutMode = useSensorStudioAssistantUiStore((s) => s.setAssistantLayoutMode);
  const setAssistantOpen = useSensorStudioAssistantUiStore((s) => s.setAssistantOpen);
  const toggleAssistant = useSensorStudioAssistantUiStore((s) => s.toggleAssistant);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey)
      {
        return;
      }
      if (e.key.toLowerCase() != "a")
      {
        return;
      }
      const t = e.target as HTMLElement | null;
      if (
        t != null &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          (typeof t.isContentEditable === "boolean" && t.isContentEditable))
      )
      {
        return;
      }
      e.preventDefault();
      toggleAssistant();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleAssistant]);

  if (!assistantOpen)
  {
    return null;
  }

  const theme = configService.getTheme().payload;

  return (
    <SensorStudioAssistantPanel
      borderColor={theme.color.border.default}
      panelBackgroundColor={theme.color.background.panel}
      layoutMode={assistantLayoutMode}
      onLayoutModeChange={setAssistantLayoutMode}
      onRequestClose={() => setAssistantOpen(false)}
      boundsRef={workspaceBoundsRef}
      onOpenSystemDiagnostics={onOpenSystemDiagnostics}
    />
  );
}

