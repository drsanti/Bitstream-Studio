import {
  FolderOpen,
  Gauge,
  KeyRound,
  Link2,
  LayoutGrid,
  LayoutTemplate,
  MessageSquareText,
  Radio,
  RefreshCcw,
  ScrollText,
  ShieldCheck,
  Usb,
  Wifi,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useSensorStudioAssistantUiStore } from "../../../sensor-studio/state/sensorStudioAssistantUi.store";
import { useBitstreamWorkspaceModeStore } from "../../../bitstream-app/state/bitstreamWorkspaceMode.store";
import { useTelemetryWorkbenchUiStore } from "../../../sensor-telemetry/store/telemetryWorkbenchUi.store.js";
import { useAdminWebsocketActivityStore } from "../../../bitstream-app/system-tools/admin-websocket-activity.store";
import { usePostMessageTraceStore } from "../../../post-message-trace/post-message-trace.store.js";
import { useOpenAssetManager } from "../../../assets-manager/hooks/useOpenAssetManager.js";
import { usePortAdminStore } from "../../../serialport/port-admin.store.js";
import {
  GlassModalHamburgerMenuPanel,
  useGlassModalHamburgerMenu,
} from "../../../ui/components/common/index.js";
import { useWorkspaceHeaderMenuSlotStore } from "../../state/workspaceHeaderMenuSlot.store.js";
import { TRNMenuItemButton } from "../../../ui/TRN/TRNMenu.js";
import { TRNSearchableMenuShell } from "../../../ui/TRN/TRNSearchableMenuShell.js";
import {
  TRNMenuFilterableSection,
  TRNMenuNoResults,
  matchesTrnMenuSearch,
  useTRNMenuItemMatches,
  useTRNMenuSearchState,
} from "../../../ui/TRN/TRNMenuSearch.js";

export type BitstreamHeaderMenuState = ReturnType<typeof useGlassModalHamburgerMenu>;

type ShellMenuItemDef = {
  id: string;
  section: string;
  label: string;
  searchKeywords?: readonly string[];
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  rightSlot?: ReactNode;
};

function ShellMenuItemRow(props: { item: ShellMenuItemDef }) {
  const { item } = props;
  const visible = useTRNMenuItemMatches(item.label, item.searchKeywords);
  const Icon = item.icon;

  if (!visible) {
    return null;
  }

  return (
    <TRNMenuItemButton
      role="menuitem"
      disabled={item.disabled}
      onClick={item.onClick}
      icon={<Icon className="h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />}
      label={item.label}
      title={item.title}
      rightSlot={item.rightSlot}
    />
  );
}

export function BitstreamHeaderMenuPanel(props: {
  menu: BitstreamHeaderMenuState;
  glassModalPanelId: string;
  triggerSelector: string;
  onOpenWifiPanel: () => void;
  onOpenFirmwareLogLevel: () => void;
  onOpenCommandConfirmation: () => void;
  onOpenAiDevTrace: () => void;
  onOpenAiBridgeSettings: () => void;
  onOpenAnthropicApiKeySettings: () => void;
  onOpenTelemetryPerformanceSettings: () => void;
  onOpenTelemetryLinkDiagnostics: () => void;
  onOpenSystemDiagnostics: () => void;
  onOpenConnection: () => void;
  onOpenSystemLogs: () => void;
}) {
  const {
    menu,
    glassModalPanelId,
    triggerSelector,
    onOpenWifiPanel,
    onOpenFirmwareLogLevel,
    onOpenCommandConfirmation,
    onOpenAiDevTrace,
    onOpenAiBridgeSettings,
    onOpenAnthropicApiKeySettings,
    onOpenTelemetryPerformanceSettings,
    onOpenTelemetryLinkDiagnostics,
    onOpenSystemDiagnostics,
    onOpenConnection,
    onOpenSystemLogs,
  } = props;

  const workspace = useBitstreamWorkspaceModeStore((s) => s.workspace);
  const setWorkspace = useBitstreamWorkspaceModeStore((s) => s.setWorkspace);
  const invokeResetTelemetryLayout = useTelemetryWorkbenchUiStore((s) => s.invokeResetLayout);

  const assistantOpen = useSensorStudioAssistantUiStore((s) => s.assistantOpen);
  const toggleAssistant = useSensorStudioAssistantUiStore((s) => s.toggleAssistant);
  const workspaceMenuSections = useWorkspaceHeaderMenuSlotStore((s) => s.sections);

  const { openAssetManager } = useOpenAssetManager();
  const openPortAdmin = usePortAdminStore((s) => s.open);
  const openAdminWebsocketActivity = useAdminWebsocketActivityStore((s) => s.open);
  const openPostMessageTrace = usePostMessageTraceStore((s) => s.open);

  const closeMenu = menu.closeMenu;

  const handleOpenWifiPanel = useCallback(() => {
    onOpenWifiPanel();
    closeMenu();
  }, [closeMenu, onOpenWifiPanel]);

  const handleOpenFirmwareLogLevel = useCallback(() => {
    onOpenFirmwareLogLevel();
    closeMenu();
  }, [closeMenu, onOpenFirmwareLogLevel]);

  const handleOpenCommandConfirmation = useCallback(() => {
    onOpenCommandConfirmation();
    closeMenu();
  }, [closeMenu, onOpenCommandConfirmation]);

  const handleOpenPortAdmin = useCallback(() => {
    openPortAdmin();
    closeMenu();
  }, [closeMenu, openPortAdmin]);

  const handleOpenWebsocketActivity = useCallback(() => {
    openAdminWebsocketActivity();
    closeMenu();
  }, [closeMenu, openAdminWebsocketActivity]);

  const handleOpenPostMessageTrace = useCallback(() => {
    openPostMessageTrace();
    closeMenu();
  }, [closeMenu, openPostMessageTrace]);

  const handleOpenTelemetryPerformanceSettings = useCallback(() => {
    onOpenTelemetryPerformanceSettings();
    closeMenu();
  }, [closeMenu, onOpenTelemetryPerformanceSettings]);

  const handleOpenTelemetryLinkDiagnostics = useCallback(() => {
    onOpenTelemetryLinkDiagnostics();
    closeMenu();
  }, [closeMenu, onOpenTelemetryLinkDiagnostics]);

  const handleOpenAiDevTrace = useCallback(() => {
    onOpenAiDevTrace();
    closeMenu();
  }, [closeMenu, onOpenAiDevTrace]);

  const handleOpenAiBridgeSettings = useCallback(() => {
    onOpenAiBridgeSettings();
    closeMenu();
  }, [closeMenu, onOpenAiBridgeSettings]);

  const handleOpenAnthropicApiKeySettings = useCallback(() => {
    onOpenAnthropicApiKeySettings();
    closeMenu();
  }, [closeMenu, onOpenAnthropicApiKeySettings]);

  const handleOpenSystemDiagnostics = useCallback(() => {
    onOpenSystemDiagnostics();
    closeMenu();
  }, [closeMenu, onOpenSystemDiagnostics]);

  const handleOpenConnection = useCallback(() => {
    onOpenConnection();
    closeMenu();
  }, [closeMenu, onOpenConnection]);

  const handleOpenSystemLogs = useCallback(() => {
    onOpenSystemLogs();
    closeMenu();
  }, [closeMenu, onOpenSystemLogs]);

  const [devRestartBusy, setDevRestartBusy] = useState(false);
  const handleDevRestart = useCallback(async () => {
    if (!import.meta.env.DEV || devRestartBusy) {
      return;
    }
    setDevRestartBusy(true);
    try {
      await fetch("http://127.0.0.1:9910/restart", { method: "POST" });
    } finally {
      setTimeout(() => setDevRestartBusy(false), 800);
      closeMenu();
    }
  }, [devRestartBusy, closeMenu]);

  const handleToggleBitstreamAssistant = useCallback(() => {
    toggleAssistant();
    closeMenu();
  }, [closeMenu, toggleAssistant]);

  const handleWorkspaceTelemetry = useCallback(() => {
    setWorkspace("sensor-telemetry");
    closeMenu();
  }, [closeMenu, setWorkspace]);

  const handleWorkspaceSensorStudio = useCallback(() => {
    setWorkspace("sensor-studio");
    closeMenu();
  }, [closeMenu, setWorkspace]);

  const handleResetTelemetryLayout = useCallback(() => {
    invokeResetTelemetryLayout();
    closeMenu();
  }, [closeMenu, invokeResetTelemetryLayout]);

  const handleOpenAssetManager = useCallback(() => {
    openAssetManager();
    closeMenu();
  }, [closeMenu, openAssetManager]);

  const assistantLabel = assistantOpen ? "Hide Bitstream Assistant" : "Bitstream Assistant";

  const shellMenuItems = useMemo((): ShellMenuItemDef[] => {
    const items: ShellMenuItemDef[] = [
      {
        id: "workspace-telemetry",
        section: "Workspace",
        label: "Sensor Telemetry",
        searchKeywords: ["telemetry", "workspace"],
        icon: LayoutGrid,
        onClick: handleWorkspaceTelemetry,
        disabled: workspace === "sensor-telemetry",
      },
      {
        id: "workspace-sensor-studio",
        section: "Workspace",
        label: "Sensor Studio workspace",
        searchKeywords: ["studio", "flow", "workspace"],
        icon: Workflow,
        onClick: handleWorkspaceSensorStudio,
        disabled: workspace === "sensor-studio",
      },
      {
        id: "workspace-reset-layout",
        section: "Workspace",
        label: "Reset telemetry layout",
        searchKeywords: ["layout", "reset", "workbench"],
        icon: LayoutTemplate,
        onClick: handleResetTelemetryLayout,
        disabled: workspace !== "sensor-telemetry",
        title: "Restore default config · main · live · activity pane split",
      },
      {
        id: "asset-manager",
        section: "Assets",
        label: "Asset Manager",
        searchKeywords: ["assets", "models", "files"],
        icon: FolderOpen,
        onClick: handleOpenAssetManager,
        title: "Open Asset Manager (Alt+M)",
        rightSlot: (
          <span className="font-mono text-[10px] text-zinc-500" aria-hidden>
            Alt+M
          </span>
        ),
      },
      {
        id: "assistant",
        section: "Assets",
        label: assistantLabel,
        searchKeywords: ["ai", "chat", "assistant"],
        icon: MessageSquareText,
        onClick: handleToggleBitstreamAssistant,
      },
      {
        id: "telemetry-performance",
        section: "Assets",
        label: "Telemetry Performance",
        searchKeywords: ["fps", "charts", "ui"],
        icon: Gauge,
        onClick: handleOpenTelemetryPerformanceSettings,
      },
      {
        id: "telemetry-diagnostics",
        section: "Assets",
        label: "Telemetry diagnostics",
        searchKeywords: ["link", "brx", "decode", "rx"],
        icon: Radio,
        onClick: handleOpenTelemetryLinkDiagnostics,
      },
      {
        id: "command-confirmation",
        section: "Assets",
        label: "Command Confirmation",
        searchKeywords: ["firmware", "ack", "safety"],
        icon: ShieldCheck,
        onClick: handleOpenCommandConfirmation,
      },
      {
        id: "ai-dev-trace",
        section: "Assets",
        label: "AI Dev Trace",
        searchKeywords: ["ai", "debug", "trace"],
        icon: Gauge,
        onClick: handleOpenAiDevTrace,
      },
      {
        id: "ai-bridge-settings",
        section: "Assets",
        label: "AI Bridge Settings",
        searchKeywords: ["ai", "bridge", "9987"],
        icon: Gauge,
        onClick: handleOpenAiBridgeSettings,
      },
      {
        id: "assistant-ai-settings",
        section: "Assets",
        label: "Assistant AI settings",
        searchKeywords: ["anthropic", "api key", "ai"],
        icon: KeyRound,
        onClick: handleOpenAnthropicApiKeySettings,
      },
      {
        id: "connection",
        section: "System",
        label: "Connection…",
        searchKeywords: ["bridge", "websocket", "com", "handshake", "link"],
        icon: Link2,
        onClick: handleOpenConnection,
        title: "Step-by-step bridge, WebSocket, COM, and handshake",
      },
      {
        id: "system-logs",
        section: "System",
        label: "System logs",
        searchKeywords: ["activity", "log"],
        icon: ScrollText,
        onClick: handleOpenSystemLogs,
      },
      {
        id: "system-diagnostics",
        section: "System",
        label: "Diagnostics & runtime services",
        searchKeywords: ["broker", "mqtt", "services", "runtime"],
        icon: Gauge,
        onClick: handleOpenSystemDiagnostics,
      },
      {
        id: "wifi-control",
        section: "System",
        label: "Wi-Fi Control",
        searchKeywords: ["wifi", "network"],
        icon: Wifi,
        onClick: handleOpenWifiPanel,
      },
      {
        id: "firmware-log-level",
        section: "System",
        label: "Firmware Log Level",
        searchKeywords: ["firmware", "log", "verbosity"],
        icon: Gauge,
        onClick: handleOpenFirmwareLogLevel,
      },
      {
        id: "port-admin",
        section: "System",
        label: "Port Admin",
        searchKeywords: ["serial", "com", "uart", "usb", "allow"],
        icon: Usb,
        onClick: handleOpenPortAdmin,
      },
      {
        id: "websocket-activity",
        section: "System",
        label: "WebSocket Activity",
        searchKeywords: ["ws", "broker", "traffic"],
        icon: Gauge,
        onClick: handleOpenWebsocketActivity,
      },
      {
        id: "postmessage-trace",
        section: "System",
        label: "PostMessage Trace",
        searchKeywords: ["vscode", "extension", "host"],
        icon: Gauge,
        onClick: handleOpenPostMessageTrace,
      },
    ];

    if (import.meta.env.DEV) {
      items.push({
        id: "dev-restart",
        section: "Developer",
        label: devRestartBusy ? "Restarting dev server…" : "Restart dev server",
        searchKeywords: ["vite", "hmr"],
        icon: RefreshCcw,
        onClick: () => {
          void handleDevRestart();
        },
        disabled: devRestartBusy,
      });
    }

    return items;
  }, [
    assistantLabel,
    devRestartBusy,
    handleDevRestart,
    handleOpenAiBridgeSettings,
    handleOpenAiDevTrace,
    handleOpenAnthropicApiKeySettings,
    handleOpenAssetManager,
    handleOpenCommandConfirmation,
    handleOpenConnection,
    handleOpenFirmwareLogLevel,
    handleOpenPortAdmin,
    handleOpenPostMessageTrace,
    handleOpenSystemDiagnostics,
    handleOpenSystemLogs,
    handleOpenTelemetryLinkDiagnostics,
    handleOpenTelemetryPerformanceSettings,
    handleOpenWebsocketActivity,
    handleOpenWifiPanel,
    handleResetTelemetryLayout,
    handleToggleBitstreamAssistant,
    handleWorkspaceSensorStudio,
    handleWorkspaceTelemetry,
    workspace,
  ]);

  const sectionOrder = useMemo(() => {
    const order: string[] = [];
    for (const item of shellMenuItems) {
      if (!order.includes(item.section)) {
        order.push(item.section);
      }
    }
    return order;
  }, [shellMenuItems]);

  const itemsBySection = useMemo(() => {
    const map = new Map<string, ShellMenuItemDef[]>();
    for (const item of shellMenuItems) {
      const bucket = map.get(item.section) ?? [];
      bucket.push(item);
      map.set(item.section, bucket);
    }
    return map;
  }, [shellMenuItems]);

  const menuItemCount = useMemo(() => {
    let count = shellMenuItems.length;
    if (workspaceMenuSections != null) {
      count += WORKSPACE_SLOT_SEARCH_LABELS.length;
    }
    return count;
  }, [shellMenuItems.length, workspaceMenuSections]);

  return (
    <GlassModalHamburgerMenuPanel
      menu={menu}
      glassModalPanelId={glassModalPanelId}
      placement="end"
      triggerSelector={triggerSelector}
      menuAriaLabel="Bitstream app menu"
      shellClassName="w-full border-0 bg-transparent p-0 shadow-none backdrop-blur-none ring-0"
    >
      <TRNSearchableMenuShell menuOpen={menu.open} itemCount={menuItemCount}>
        <BitstreamHeaderMenuBody
          sectionOrder={sectionOrder}
          itemsBySection={itemsBySection}
          workspaceMenuSections={workspaceMenuSections}
        />
      </TRNSearchableMenuShell>
    </GlassModalHamburgerMenuPanel>
  );
}

const WORKSPACE_SLOT_SEARCH_LABELS = [
  "Telemetry workspace",
  "Devices",
  "View",
  "Presets",
  "My layouts",
  "Layout library",
  "Reset",
  "Save current layout as",
  "Manage layouts",
  "Export current layout",
  "Import layout",
  "Reset to factory default",
] as const;

function BitstreamHeaderMenuBody(props: {
  sectionOrder: readonly string[];
  itemsBySection: ReadonlyMap<string, ShellMenuItemDef[]>;
  workspaceMenuSections: ReactNode;
}) {
  const { sectionOrder, itemsBySection, workspaceMenuSections } = props;
  const { isSearching, itemMatches, query } = useTRNMenuSearchState();

  const shellVisibleCount = useMemo(() => {
    let count = 0;
    for (const items of itemsBySection.values()) {
      for (const item of items) {
        if (itemMatches(item.label, item.searchKeywords)) {
          count += 1;
        }
      }
    }
    return count;
  }, [itemMatches, itemsBySection]);

  const workspaceSlotMayMatch = useMemo(() => {
    if (!isSearching || workspaceMenuSections == null) {
      return false;
    }
    return WORKSPACE_SLOT_SEARCH_LABELS.some((label) =>
      matchesTrnMenuSearch(query, label),
    );
  }, [isSearching, query, workspaceMenuSections]);

  return (
    <div className="flex flex-col gap-1">
      {sectionOrder.map((section, sectionIndex) => {
        const items = itemsBySection.get(section) ?? [];
        const sectionSpacing = sectionIndex === 0 ? "menuFirst" : "menuNext";
        const sectionLabels =
          section === "Workspace" && workspaceMenuSections != null
            ? [...items.map((item) => item.label), ...WORKSPACE_SLOT_SEARCH_LABELS]
            : items.map((item) => item.label);

        if (
          section === "Workspace" &&
          workspaceMenuSections != null &&
          (workspaceSlotMayMatch || !isSearching)
        ) {
          return (
            <TRNMenuFilterableSection
              key={section}
              title={section}
              itemLabels={sectionLabels}
              spacing={sectionSpacing}
            >
              {items.map((item) => (
                <ShellMenuItemRow key={item.id} item={item} />
              ))}
              {workspaceMenuSections}
            </TRNMenuFilterableSection>
          );
        }

        return (
          <TRNMenuFilterableSection
            key={section}
            title={section}
            itemLabels={sectionLabels}
            spacing={sectionSpacing}
          >
            {items.map((item) => (
              <ShellMenuItemRow key={item.id} item={item} />
            ))}
          </TRNMenuFilterableSection>
        );
      })}
      <TRNMenuNoResults
        visible={
          isSearching && shellVisibleCount === 0 && !workspaceSlotMayMatch
        }
      />
    </div>
  );
}
