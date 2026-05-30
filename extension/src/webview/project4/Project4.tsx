import {
  Bot,
  Boxes,
  CircleHelp,
  Cog,
  Disc,
  Globe2,
  Palette,
  Settings,
  Sparkles,
  Wrench,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Project4HardwareSetupPanel } from "./components/hardware/Project4HardwareSetupPanel";
import { Project4GraphicsSetupPanel } from "./components/twin/Project4GraphicsSetupPanel";
import { Project4TwinViewerSetupPanel } from "./components/twin/Project4TwinViewerSetupPanel";
import { Project4SettingsPanel } from "./components/Project4SettingsPanel";
import { Project4HudPanelMenu } from "./components/overlay/Project4HudPanelMenu";
import { Project4McuTelemetrySourceToggle } from "./components/overlay/Project4McuTelemetrySourceToggle";
import { Project4AssistantPanel } from "./components/assistant/Project4AssistantPanel";
import { Project4DigitalTwinCopilotHelpWindow } from "./components/assistant/Project4DigitalTwinCopilotHelpWindow";
import { Project4ViewportShell } from "./components/overlay/Project4ViewportShell";
import { useProject4Telemetry } from "./hooks/useProject4Telemetry";
import {
  PROJECT4_TWIN_CUBEMAP_IDS,
  PROJECT4_TWIN_CUBEMAP_NONE,
} from "./lib/project4-twin-environments";
import { PROJECT4_FLOATING_WINDOW_BODY_FONT_CLASS } from "./lib/project4-floating-window-typography";
import {
  PROJECT4_WINDOW_RECT_ASSISTANT,
  PROJECT4_WINDOW_RECT_COPILOT_HELP,
  PROJECT4_WINDOW_RECT_GRAPHICS_SETUP,
  PROJECT4_WINDOW_RECT_HARDWARE_SETUP,
  PROJECT4_WINDOW_RECT_SETTINGS,
  PROJECT4_WINDOW_RECT_TWIN_VIEWER_SETUP,
  clearPersistedProject4WindowRects,
  getDefaultProject4OverlayWindowsVisibility,
  loadProject4OverlayWindowsVisibility,
  saveProject4OverlayWindowsVisibility,
} from "./lib/project4-overlay-windows-storage";
import { useProject4SettingsStore } from "./settings/project4-settings.store";
import { TRNIconButton } from "../ui/TRN/TRNIconButton";
import { TRNSelect } from "../ui/TRN/TRNSelect";
import { TRNWindow } from "../ui/TRN/TRNWindow";
import { twMerge } from "tailwind-merge";

export default function Project4() {
  const viewportBoundsRef = useRef<HTMLDivElement | null>(null);

  const overlayVisInitialRef = useRef(loadProject4OverlayWindowsVisibility());
  const [windowLayoutEpoch, setWindowLayoutEpoch] = useState(0);

  const [settingsOpen, setSettingsOpen] = useState(
    () => overlayVisInitialRef.current.settingsOpen,
  );
  const onCloseSettings = useCallback(() => setSettingsOpen(false), []);

  const [assistantOpen, setAssistantOpen] = useState(
    () => overlayVisInitialRef.current.assistantOpen,
  );
  const onCloseAssistant = useCallback(() => setAssistantOpen(false), []);

  const [copilotHelpOpen, setCopilotHelpOpen] = useState(
    () => overlayVisInitialRef.current.copilotHelpOpen,
  );
  const onCloseCopilotHelp = useCallback(() => setCopilotHelpOpen(false), []);

  const [hardwareSetupOpen, setHardwareSetupOpen] = useState(
    () => overlayVisInitialRef.current.hardwareSetupOpen,
  );
  const onCloseHardwareSetup = useCallback(() => setHardwareSetupOpen(false), []);

  const [twinViewerSetupOpen, setTwinViewerSetupOpen] = useState(
    () => overlayVisInitialRef.current.twinViewerSetupOpen,
  );
  const onCloseTwinViewerSetup = useCallback(() => setTwinViewerSetupOpen(false), []);

  const [graphicsSetupOpen, setGraphicsSetupOpen] = useState(
    () => overlayVisInitialRef.current.graphicsSetupOpen,
  );
  const onCloseGraphicsSetup = useCallback(() => setGraphicsSetupOpen(false), []);

  useEffect(() => {
    saveProject4OverlayWindowsVisibility({
      assistantOpen,
      copilotHelpOpen,
      graphicsSetupOpen,
      twinViewerSetupOpen,
      hardwareSetupOpen,
      settingsOpen,
    });
  }, [
    assistantOpen,
    copilotHelpOpen,
    graphicsSetupOpen,
    twinViewerSetupOpen,
    hardwareSetupOpen,
    settingsOpen,
  ]);

  const resetFloatingWindowLayouts = useCallback(() => {
    clearPersistedProject4WindowRects();
    const vis = getDefaultProject4OverlayWindowsVisibility();
    saveProject4OverlayWindowsVisibility(vis);
    setAssistantOpen(vis.assistantOpen);
    setCopilotHelpOpen(vis.copilotHelpOpen);
    setGraphicsSetupOpen(vis.graphicsSetupOpen);
    setTwinViewerSetupOpen(vis.twinViewerSetupOpen);
    setHardwareSetupOpen(vis.hardwareSetupOpen);
    setSettingsOpen(vis.settingsOpen);
    setWindowLayoutEpoch((n) => n + 1);
  }, []);

  const modalsCaptureKeyboard =
    settingsOpen ||
    hardwareSetupOpen ||
    twinViewerSetupOpen ||
    graphicsSetupOpen ||
    copilotHelpOpen;

  const telemetry = useProject4Telemetry();
  const telemetryRef = useRef(telemetry);
  telemetryRef.current = telemetry;

  const twinCubemapEnvironmentId = useProject4SettingsStore((s) => s.twinCubemapEnvironmentId);
  const patchProject4Settings = useProject4SettingsStore((s) => s.patchProject4Settings);

  const cubemapSelectOptions = useMemo(
    () => [
      { value: PROJECT4_TWIN_CUBEMAP_NONE, label: "None (solid)" },
      ...PROJECT4_TWIN_CUBEMAP_IDS.map((id) => ({ value: id, label: id })),
    ],
    [],
  );

  return (
    <div className="fixed inset-0 overflow-hidden bg-zinc-950 text-zinc-100">
      <div className="relative h-full min-h-0 w-full">
        <Project4ViewportShell
          viewportBoundsRef={viewportBoundsRef}
          telemetryRef={telemetryRef}
          telemetry={telemetry}
          driveKeyboardEnabled={!modalsCaptureKeyboard}
        />
      </div>

      <div className="pointer-events-none absolute left-1/2 top-3 z-[85] flex -translate-x-1/2 items-center gap-2">
        <TRNIconButton
          type="button"
          label="Digital Twin Copilot — AI chat and robot tools over the bridge (toggle)"
          icon={<Sparkles className="h-4 w-4 text-sky-400/90" strokeWidth={2} />}
          onClick={() => setAssistantOpen((open) => !open)}
          className="pointer-events-auto border border-zinc-700/80 bg-zinc-900/90 text-zinc-200 shadow-md backdrop-blur-sm hover:bg-zinc-800/95"
        />
      </div>

      <div className="pointer-events-none absolute right-3 top-3 z-[85] flex items-center gap-2">
        <Project4HudPanelMenu onResetFloatingWindowLayouts={resetFloatingWindowLayouts} />
        <Project4McuTelemetrySourceToggle />
        <TRNSelect
          trigger="icon"
          iconTrigger={<Globe2 className="h-4 w-4 text-sky-400/85" strokeWidth={2} />}
          size="sm"
          ariaLabel="Twin 3D cubemap environment — choose preset"
          value={twinCubemapEnvironmentId}
          options={cubemapSelectOptions}
          onValueChange={(v) => patchProject4Settings({ twinCubemapEnvironmentId: v })}
          className="pointer-events-auto"
        />
        <TRNIconButton
          type="button"
          label="Hardware setup — robot geometry and MCU telemetry sweep"
          icon={<Wrench className="h-4 w-4" />}
          onClick={() => setHardwareSetupOpen(true)}
          className="pointer-events-auto border border-zinc-700/80 bg-zinc-900/90 text-zinc-200 shadow-md backdrop-blur-sm hover:bg-zinc-800/95"
        />
        <TRNIconButton
          type="button"
          label="Digital twin setup — 3D scanner bearing range on the model (not MCU)"
          icon={<Boxes className="h-4 w-4" />}
          onClick={() => setTwinViewerSetupOpen(true)}
          className="pointer-events-auto border border-zinc-700/80 bg-zinc-900/90 text-zinc-200 shadow-md backdrop-blur-sm hover:bg-zinc-800/95"
        />
        <TRNIconButton
          type="button"
          label="Graphics setup — renderer, environment intensity, lights"
          icon={<Palette className="h-4 w-4" />}
          onClick={() => setGraphicsSetupOpen(true)}
          className="pointer-events-auto border border-zinc-700/80 bg-zinc-900/90 text-zinc-200 shadow-md backdrop-blur-sm hover:bg-zinc-800/95"
        />
        <TRNIconButton
          type="button"
          label="Project 4 settings"
          icon={<Settings className="h-4 w-4" />}
          onClick={() => setSettingsOpen(true)}
          className="pointer-events-auto border border-zinc-700/80 bg-zinc-900/90 text-zinc-200 shadow-md backdrop-blur-sm hover:bg-zinc-800/95"
        />
      </div>

      <TRNWindow
        key={`project4-trn-assistant-${windowLayoutEpoch}`}
        open={assistantOpen}
        title="Digital Twin Copilot"
        prefixIcon={
          <span className="inline-flex items-center gap-0.5 text-zinc-300" aria-hidden>
            <Sparkles className="h-3 w-3 shrink-0 text-sky-400/90" strokeWidth={2.25} />
            <Bot className="h-3.5 w-3.5 shrink-0 text-zinc-200" strokeWidth={2.25} />
            <Disc className="h-3 w-3 shrink-0 text-zinc-400/85" strokeWidth={2.25} />
            <Cog className="h-3 w-3 shrink-0 text-zinc-500/90" strokeWidth={2.25} />
          </span>
        }
        onClose={onCloseAssistant}
        boundsRef={viewportBoundsRef}
        modal={false}
        zIndex={92}
        reopenStrategy="preserve"
        persistRectStorageKey={PROJECT4_WINDOW_RECT_ASSISTANT}
        draggable
        resizable
        heightMode="auto"
        autoHeightMaxViewportFraction={0.85}
        showFooter={false}
        initialRect={{ x: 88, y: 48, width: 440, height: 560 }}
        glass={false}
        contentClassName={twMerge(
          PROJECT4_FLOATING_WINDOW_BODY_FONT_CLASS,
          "bg-zinc-950 flex min-h-0 flex-1 flex-col overflow-hidden p-0 max-h-[min(85vh,720px)]",
        )}
        contentStyle={{ backgroundColor: "rgb(9 9 11)" }}
        headerActions={
          <button
            type="button"
            className="box-border h-6 min-w-6 rounded border-0 bg-transparent px-1 text-xs text-zinc-300 transition-colors hover:bg-zinc-800/85 hover:text-zinc-100"
            aria-label="Copilot help — example prompts and system overview"
            title="Help"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setCopilotHelpOpen(true)}
          >
            <span className="inline-flex items-center justify-center pt-0.5">
              <CircleHelp className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
            </span>
          </button>
        }
      >
        <Project4AssistantPanel />
      </TRNWindow>

      <Project4DigitalTwinCopilotHelpWindow
        key={`project4-trn-copilot-help-${windowLayoutEpoch}`}
        open={copilotHelpOpen}
        onClose={onCloseCopilotHelp}
        persistRectStorageKey={PROJECT4_WINDOW_RECT_COPILOT_HELP}
      />

      <TRNWindow
        key={`project4-trn-graphics-${windowLayoutEpoch}`}
        open={graphicsSetupOpen}
        title="Graphics setup"
        onClose={onCloseGraphicsSetup}
        modal={false}
        zIndex={93}
        reopenStrategy="preserve"
        persistRectStorageKey={PROJECT4_WINDOW_RECT_GRAPHICS_SETUP}
        draggable
        resizable
        heightMode="auto"
        autoHeightMaxViewportFraction={0.82}
        showFooter={false}
        initialRect={{ x: 104, y: 104, width: 520, height: 620 }}
        glass={false}
        contentClassName={twMerge(PROJECT4_FLOATING_WINDOW_BODY_FONT_CLASS, "bg-zinc-950")}
        contentStyle={{ backgroundColor: "rgb(9 9 11)" }}
      >
        <Project4GraphicsSetupPanel />
      </TRNWindow>

      <TRNWindow
        key={`project4-trn-twin-viewer-${windowLayoutEpoch}`}
        open={twinViewerSetupOpen}
        title="Digital twin setup"
        onClose={onCloseTwinViewerSetup}
        modal={false}
        zIndex={93}
        reopenStrategy="preserve"
        persistRectStorageKey={PROJECT4_WINDOW_RECT_TWIN_VIEWER_SETUP}
        draggable
        resizable
        heightMode="auto"
        autoHeightMaxViewportFraction={0.82}
        showFooter={false}
        initialRect={{ x: 112, y: 112, width: 480, height: 520 }}
        glass={false}
        contentClassName={twMerge(PROJECT4_FLOATING_WINDOW_BODY_FONT_CLASS, "bg-zinc-950")}
        contentStyle={{ backgroundColor: "rgb(9 9 11)" }}
      >
        <Project4TwinViewerSetupPanel />
      </TRNWindow>

      <TRNWindow
        key={`project4-trn-hardware-${windowLayoutEpoch}`}
        open={hardwareSetupOpen}
        title="Hardware setup"
        onClose={onCloseHardwareSetup}
        modal={false}
        zIndex={93}
        reopenStrategy="preserve"
        persistRectStorageKey={PROJECT4_WINDOW_RECT_HARDWARE_SETUP}
        draggable
        resizable
        heightMode="auto"
        autoHeightMaxViewportFraction={0.82}
        showFooter={false}
        initialRect={{ x: 96, y: 96, width: 520, height: 560 }}
        glass={false}
        contentClassName={twMerge(PROJECT4_FLOATING_WINDOW_BODY_FONT_CLASS, "bg-zinc-950")}
        contentStyle={{ backgroundColor: "rgb(9 9 11)" }}
      >
        <Project4HardwareSetupPanel />
      </TRNWindow>

      <TRNWindow
        key={`project4-trn-settings-${windowLayoutEpoch}`}
        open={settingsOpen}
        title="Project 4 settings"
        onClose={onCloseSettings}
        modal={false}
        zIndex={93}
        reopenStrategy="preserve"
        persistRectStorageKey={PROJECT4_WINDOW_RECT_SETTINGS}
        draggable
        resizable
        heightMode="auto"
        autoHeightMaxViewportFraction={0.85}
        showFooter={false}
        initialRect={{ x: 120, y: 72, width: 560, height: 640 }}
        glass={false}
        contentClassName={twMerge(PROJECT4_FLOATING_WINDOW_BODY_FONT_CLASS, "bg-zinc-950")}
        contentStyle={{ backgroundColor: "rgb(9 9 11)" }}
      >
        <Project4SettingsPanel />
      </TRNWindow>
    </div>
  );
}
