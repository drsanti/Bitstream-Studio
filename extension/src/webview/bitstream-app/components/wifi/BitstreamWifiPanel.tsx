/*******************************************************************************
 * File Name        : BitstreamWifiPanel.tsx
 *
 * Description      : Tabbed Wi‑Fi control panel (Status / Connect / Networks / Activity).
 *
 * Author           : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version          : 1.0
 * Target           : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { Activity, History, Link2, Wifi } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BS2_CAPS_TIME, BS2_CAPS_WIFI } from "../../../../bitstream2/protocol/caps-flags";
import { BitstreamDeviceClockCard } from "../device/BitstreamDeviceClockCard";
import {
  resolveWcmSecurityUint32,
  WCM_SECURITY_PRESET_DEFAULT_KEY,
} from "../../../../bitstream/wifi/wifi-wcm-security";
import {
  TRN_INSPECTOR_TAB_ACTIVE_CLASS,
  TRN_INSPECTOR_TAB_BAR_WRAP_CLASS,
  TRN_INSPECTOR_TAB_LABEL_CLASS,
  TRN_INSPECTOR_TAB_LIST_CLASS,
  TRN_INSPECTOR_TAB_TRIGGER_CLASS,
  TRNTabs,
  TRNTabsContent,
  TRNTabsList,
  TRNTabsTrigger,
  TRNSortableSettingsCardList,
  type TRNSortableSettingsCardItem,
} from "@/ui/TRN";
import { useBitstreamAppControl } from "../../BitstreamAppWrapper";
import { useBitstreamLiveStore } from "../../state/bitstreamLive.store";
import { useBitstreamWifiStore } from "../../state/bitstreamWifi.store";
import { useBitstreamConnectionStore } from "../../state/bitstreamConnection.store";
import { WifiConnectionControlCard } from "./WifiConnectionControlCard";
import { WifiDiagnosticsCard } from "./WifiDiagnosticsCard";
import { useWifiScanSession } from "./useWifiScanSession";
import { WifiNetworksTab } from "./WifiNetworksTab";
import { WifiRssiTrendCard } from "./WifiRssiTrendCard";
import { WifiStatusSummaryCard } from "./WifiStatusSummaryCard";
import {
  appendWifiActivityEvent,
  createWifiActivityEvent,
  wifiActivityFromLinkStatus,
  type WifiActivityEvent,
} from "./wifi-activity-events";
import {
  formatCapsWarningForUser,
  resolveWifiUserBusyToken,
  type WifiUserBusyToken,
} from "./wifi-panel-utils";
import { WIFI_TAB_CONTENT_CLASS } from "./wifi-panel-layout";

const WIFI_PANEL_TAB_KEY = "bitstream-app:wifi-panel-tab";
const WIFI_STATUS_CARDS_KEY = "bitstream-app:wifi-status-cards";
const WIFI_CONNECT_CARDS_KEY = "bitstream-app:wifi-connect-cards";
const WIFI_ACTIVITY_CARDS_KEY = "bitstream-app:wifi-activity-cards";
type WifiPanelTab = "status" | "connect" | "networks" | "activity";

function loadWifiPanelTab(): WifiPanelTab {
  if (typeof localStorage === "undefined") {
    return "status";
  }
  try {
    const raw = localStorage.getItem(WIFI_PANEL_TAB_KEY);
    if (raw === "connect" || raw === "networks" || raw === "activity" || raw === "status") {
      return raw;
    }
  } catch {
    // ignore
  }
  return "status";
}

export function BitstreamWifiPanel(props: { className?: string }) {
  const { className } = props;
  const handshakeState = useBitstreamLiveStore((s) => s.handshakeState);
  const capsFlags = useBitstreamLiveStore((s) => s.handshake?.capsFlags ?? 0);
  const wifiAdvertised = (capsFlags & BS2_CAPS_WIFI) !== 0;
  const timeAdvertised = (capsFlags & BS2_CAPS_TIME) !== 0;

  const lastStatus = useBitstreamWifiStore((s) => s.lastStatus);
  const lastScanComplete = useBitstreamWifiStore((s) => s.lastScanComplete);
  const scanRows = useBitstreamWifiStore((s) => s.scanRows);
  const autoConnectEnabled = useBitstreamWifiStore((s) => s.autoConnectEnabled);
  const lastRx = useBitstreamWifiStore((s) => s.lastRx);
  const logs = useBitstreamConnectionStore((s) => s.logs);

  const {
    wifiScanAll,
    wifiScanSsid,
    wifiConnect,
    wifiDisconnect,
    wifiStatusPoll,
    wifiPolicyGet,
    wifiPolicySet,
  } = useBitstreamAppControl();

  const [activeTab, setActiveTab] = useState<WifiPanelTab>(() => loadWifiPanelTab());
  const [ssid, setSsid] = useState(() => (import.meta.env.DEV ? "TERNION" : ""));
  const [password, setPassword] = useState(() => (import.meta.env.DEV ? "111122134" : ""));
  const [securityPresetKey, setSecurityPresetKey] = useState(WCM_SECURITY_PRESET_DEFAULT_KEY);
  const [securityCustomText, setSecurityCustomText] = useState("");
  const [scanFilter, setScanFilter] = useState("");
  const [busy, setBusy] = useState<WifiUserBusyToken | null>(null);
  const [rssiHistory, setRssiHistory] = useState<number[]>([]);
  const [recentEvents, setRecentEvents] = useState<WifiActivityEvent[]>([]);
  const lastUartEventRef = useRef<string | null>(null);
  const lastHostDiagEventRef = useRef<string | null>(null);
  const policyLoadedRef = useRef(false);

  const disabledReason = useMemo(() => {
    if (handshakeState !== "passed") {
      return "Connect to the device first (wait for handshake).";
    }
    return null;
  }, [handshakeState]);

  const capsWarning = useMemo(
    () => formatCapsWarningForUser(wifiAdvertised, lastRx != null),
    [wifiAdvertised, lastRx],
  );

  const capsEffectivelySupported = wifiAdvertised || lastRx != null;
  const capsBlocked = handshakeState === "passed" && !capsEffectivelySupported;

  const blocked = disabledReason !== null || busy !== null;
  const connectInFlight = resolveWifiUserBusyToken(busy) === "connecting";

  const resolvedSecurityUint32 = useMemo(
    () => resolveWcmSecurityUint32(securityPresetKey, securityCustomText),
    [securityPresetKey, securityCustomText],
  );

  const wrap = useCallback(
    async (token: WifiUserBusyToken, fn: () => Promise<boolean>): Promise<boolean> => {
      setBusy(token);
      try {
        return await fn();
      } finally {
        setBusy(null);
      }
    },
    [],
  );

  const pushActivity = useCallback((evt: WifiActivityEvent) => {
    setRecentEvents((prev) => appendWifiActivityEvent(prev, evt));
  }, []);

  const { isScanActive, scanOutcome, startScanSession } = useWifiScanSession(pushActivity);

  const onTabChange = useCallback((value: string) => {
    const tab = value as WifiPanelTab;
    setActiveTab(tab);
    try {
      localStorage.setItem(WIFI_PANEL_TAB_KEY, tab);
    } catch {
      // ignore
    }
  }, []);

  const onScanAll = useCallback(async () => {
    if (capsBlocked) {
      pushActivity(
        createWifiActivityEvent("Unavailable", "error", "Scan is not available on this device."),
      );
      return;
    }
    if (isScanActive) {
      return;
    }
    const ok = await wifiScanAll();
    if (!ok) {
      pushActivity(createWifiActivityEvent("Failed", "error", "Could not start scan"));
      return;
    }
    const reqId = useBitstreamWifiStore.getState().lastTx?.reqId ?? 0;
    startScanSession(reqId);
    pushActivity(
      createWifiActivityEvent("Scan", "scan", "Scan started", "List updates as found"),
    );
  }, [capsBlocked, isScanActive, pushActivity, startScanSession, wifiScanAll]);

  const onScanFilter = useCallback(async () => {
    if (capsBlocked) {
      pushActivity(
        createWifiActivityEvent("Unavailable", "error", "Scan is not available on this device."),
      );
      return;
    }
    const f = scanFilter.trim();
    if (!f) {
      return;
    }
    if (isScanActive) {
      return;
    }
    const ok = await wifiScanSsid(f);
    if (!ok) {
      pushActivity(createWifiActivityEvent("Failed", "error", "Could not start search"));
      return;
    }
    const reqId = useBitstreamWifiStore.getState().lastTx?.reqId ?? 0;
    startScanSession(reqId);
    pushActivity(createWifiActivityEvent("Search", "scan", `Matching “${f}”`));
  }, [capsBlocked, isScanActive, pushActivity, scanFilter, startScanSession, wifiScanSsid]);

  const onConnect = useCallback(async () => {
    const s = ssid.trim();
    if (!s) {
      return;
    }
    const security = resolveWcmSecurityUint32(securityPresetKey, securityCustomText);
    const ok = await wrap("connecting", async () => wifiConnect(s, password, security));
    if (ok) {
      pushActivity(createWifiActivityEvent("Connecting", "warn", s));
      setActiveTab("status");
      try {
        localStorage.setItem(WIFI_PANEL_TAB_KEY, "status");
      } catch {
        // ignore
      }
    } else {
      pushActivity(createWifiActivityEvent("Failed", "error", `Could not connect to “${s}”`));
    }
  }, [ssid, password, securityPresetKey, securityCustomText, pushActivity, wifiConnect, wrap]);

  const onDisconnect = useCallback(async () => {
    const ok = await wrap("disconnecting", async () => wifiDisconnect());
    if (ok) {
      pushActivity(createWifiActivityEvent("Disconnecting", "warn", "In progress"));
    } else {
      pushActivity(createWifiActivityEvent("Failed", "error", "Could not disconnect"));
    }
  }, [pushActivity, wifiDisconnect, wrap]);

  const onPoll = useCallback(async () => {
    const ok = await wrap("refreshing", async () => wifiStatusPoll());
    if (ok) {
      pushActivity(createWifiActivityEvent("Updated", "info", "Connection status refreshed"));
    } else {
      pushActivity(createWifiActivityEvent("Failed", "error", "Could not refresh status"));
    }
  }, [pushActivity, wifiStatusPoll, wrap]);

  const onPolicyToggle = useCallback(async () => {
    if (capsBlocked) {
      pushActivity(
        createWifiActivityEvent("Unavailable", "error", "Auto-connect is not available on this device."),
      );
      return;
    }
    const next = !(autoConnectEnabled ?? true);
    const ok = await wrap("saving", async () => wifiPolicySet(next));
    if (ok) {
      pushActivity(
        createWifiActivityEvent("Setting", "info", `Auto-connect ${next ? "on" : "off"}`),
      );
    } else {
      pushActivity(createWifiActivityEvent("Failed", "error", "Could not change auto-connect"));
    }
  }, [autoConnectEnabled, capsBlocked, pushActivity, wifiPolicySet, wrap]);

  const onPickSsid = useCallback((picked: string) => {
    setSsid(picked);
    setActiveTab("connect");
    try {
      localStorage.setItem(WIFI_PANEL_TAB_KEY, "connect");
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (handshakeState !== "passed" || capsBlocked || policyLoadedRef.current) {
      return;
    }
    policyLoadedRef.current = true;
    void wifiPolicyGet();
  }, [handshakeState, capsBlocked, wifiPolicyGet]);

  useEffect(() => {
    if (lastStatus?.ssid && ssid.trim().length === 0) {
      setSsid(lastStatus.ssid);
    }
  }, [lastStatus?.ssid, ssid]);

  useEffect(() => {
    if (!lastStatus) {
      return;
    }
    setRssiHistory((prev) => [...prev.slice(-23), lastStatus.rssi]);
    const evt = wifiActivityFromLinkStatus(lastStatus.state, lastStatus.ssid, lastStatus.rssi);
    setRecentEvents((prev) => appendWifiActivityEvent(prev, evt));
  }, [lastStatus?.state, lastStatus?.rssi, lastStatus?.ssid, lastStatus]);

  useEffect(() => {
    if (logs.length === 0) {
      return;
    }
    const uartLog = logs.find((line) => line.includes("[UART]"));
    if (!uartLog || uartLog === lastUartEventRef.current) {
      return;
    }
    lastUartEventRef.current = uartLog;
    const normalized = uartLog.replace(/^\[[^\]]+\]\s*/, "");
    pushActivity(createWifiActivityEvent("Log", "info", normalized));
  }, [logs, pushActivity]);

  useEffect(() => {
    if (logs.length === 0) {
      return;
    }
    const hostDiag = logs.find((line) =>
      /\bWi‑Fi\b.*\b(ACK|rejected|timeout|error|transient|RX frame)\b/i.test(line),
    );
    if (!hostDiag || hostDiag === lastHostDiagEventRef.current) {
      return;
    }
    lastHostDiagEventRef.current = hostDiag;
    const normalized = hostDiag.replace(/^\[[^\]]+\]\s*/, "");
    pushActivity(createWifiActivityEvent("Device", "warn", normalized));
  }, [logs, pushActivity]);

  const currentState = lastStatus?.state ?? 0;
  const networksBadge =
    scanRows.length > 0 ? String(scanRows.length) : undefined;

  const statusCards = useMemo((): TRNSortableSettingsCardItem[] => {
    const cards: TRNSortableSettingsCardItem[] = [
      {
        id: "connection",
        title: "Connection",
        icon: <Wifi className="h-4 w-4 text-zinc-500" aria-hidden />,
        defaultExpanded: true,
        content: (
          <WifiStatusSummaryCard
            state={currentState}
            rssi={lastStatus?.rssi ?? -127}
            ssid={lastStatus?.ssid ?? ""}
            reason={lastStatus?.reason ?? 0}
            autoConnectEnabled={autoConnectEnabled}
            connectInFlight={connectInFlight}
            onRefresh={() => void onPoll()}
            onPolicyToggle={() => void onPolicyToggle()}
            refreshDisabled={blocked}
          />
        ),
      },
    ];
    if (timeAdvertised)
    {
      cards.push({
        id: "device-clock",
        title: "Device clock",
        icon: <Activity className="h-4 w-4 text-zinc-500" aria-hidden />,
        defaultExpanded: true,
        content: <BitstreamDeviceClockCard disabled={blocked} />,
      });
    }
    cards.push({
      id: "signal",
      title: "Signal over time",
      icon: <Activity className="h-4 w-4 text-zinc-500" aria-hidden />,
      defaultExpanded: true,
      content: <WifiRssiTrendCard rssiHistory={rssiHistory} />,
    });
    return cards;
  }, [
    autoConnectEnabled,
    blocked,
    connectInFlight,
    currentState,
    lastStatus?.reason,
    lastStatus?.rssi,
    lastStatus?.ssid,
    onPoll,
    onPolicyToggle,
    rssiHistory,
    timeAdvertised,
  ]);

  const connectCards = useMemo((): TRNSortableSettingsCardItem[] => {
    return [
      {
        id: "connect",
        title: "Connect to network",
        icon: <Link2 className="h-4 w-4 text-zinc-500" aria-hidden />,
        defaultExpanded: true,
        content: (
          <WifiConnectionControlCard
            blocked={blocked}
            busy={busy}
            ssid={ssid}
            password={password}
            securityPresetKey={securityPresetKey}
            securityCustomText={securityCustomText}
            resolvedSecurityUint32={resolvedSecurityUint32}
            onSsidChange={setSsid}
            onPasswordChange={setPassword}
            onSecurityPresetChange={setSecurityPresetKey}
            onSecurityCustomTextChange={setSecurityCustomText}
            onConnect={() => void onConnect()}
            onDisconnect={() => void onDisconnect()}
          />
        ),
      },
    ];
  }, [
    blocked,
    busy,
    onConnect,
    onDisconnect,
    password,
    resolvedSecurityUint32,
    securityCustomText,
    securityPresetKey,
    ssid,
  ]);

  const activityCards = useMemo((): TRNSortableSettingsCardItem[] => {
    return [
      {
        id: "activity",
        title: "Recent activity",
        icon: <History className="h-4 w-4 text-zinc-500" aria-hidden />,
        defaultExpanded: true,
        content: (
          <WifiDiagnosticsCard recentEvents={recentEvents} />
        ),
      },
    ];
  }, [recentEvents]);

  return (
    <section className={`flex shrink-0 flex-col text-xs text-zinc-200 ${className ?? ""}`}>
      {disabledReason ? (
        <p className="mb-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] leading-snug text-amber-200/90">
          {disabledReason}
        </p>
      ) : null}
      {capsWarning ? (
        <p className="mb-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] leading-snug text-amber-200/90">
          {capsWarning}
        </p>
      ) : null}

      <TRNTabs
        value={activeTab}
        onValueChange={onTabChange}
        lazyMount
        className="flex min-w-0 shrink-0 flex-col"
        activeTriggerClassName={TRN_INSPECTOR_TAB_ACTIVE_CLASS}
      >
        <div className={TRN_INSPECTOR_TAB_BAR_WRAP_CLASS}>
          <TRNTabsList className={TRN_INSPECTOR_TAB_LIST_CLASS}>
            <TRNTabsTrigger value="status" className={TRN_INSPECTOR_TAB_TRIGGER_CLASS}>
              <span className={TRN_INSPECTOR_TAB_LABEL_CLASS}>Status</span>
            </TRNTabsTrigger>
            <TRNTabsTrigger value="connect" className={TRN_INSPECTOR_TAB_TRIGGER_CLASS}>
              <span className={TRN_INSPECTOR_TAB_LABEL_CLASS}>Connect</span>
            </TRNTabsTrigger>
            <TRNTabsTrigger value="networks" className={TRN_INSPECTOR_TAB_TRIGGER_CLASS}>
              <span className={TRN_INSPECTOR_TAB_LABEL_CLASS}>
                Networks{networksBadge != null ? ` (${networksBadge})` : ""}
              </span>
            </TRNTabsTrigger>
            <TRNTabsTrigger value="activity" className={TRN_INSPECTOR_TAB_TRIGGER_CLASS}>
              <span className={TRN_INSPECTOR_TAB_LABEL_CLASS}>Activity</span>
            </TRNTabsTrigger>
          </TRNTabsList>
        </div>

        <TRNTabsContent value="status" className={WIFI_TAB_CONTENT_CLASS}>
          <TRNSortableSettingsCardList items={statusCards} panelId={WIFI_STATUS_CARDS_KEY} />
        </TRNTabsContent>

        <TRNTabsContent value="connect" className={WIFI_TAB_CONTENT_CLASS}>
          <TRNSortableSettingsCardList items={connectCards} panelId={WIFI_CONNECT_CARDS_KEY} />
        </TRNTabsContent>

        <TRNTabsContent value="networks" className={WIFI_TAB_CONTENT_CLASS}>
          <WifiNetworksTab
            blocked={blocked}
            isScanActive={isScanActive}
            scanOutcome={scanOutcome}
            scanFilter={scanFilter}
            scanRows={scanRows}
            lastScanTotalCount={lastScanComplete?.totalCount ?? null}
            onScanFilterChange={setScanFilter}
            onScanAll={() => void onScanAll()}
            onScanFilter={() => void onScanFilter()}
            onPickSsid={onPickSsid}
          />
        </TRNTabsContent>

        <TRNTabsContent value="activity" className={WIFI_TAB_CONTENT_CLASS}>
          <TRNSortableSettingsCardList items={activityCards} panelId={WIFI_ACTIVITY_CARDS_KEY} />
        </TRNTabsContent>
      </TRNTabs>
    </section>
  );
}
