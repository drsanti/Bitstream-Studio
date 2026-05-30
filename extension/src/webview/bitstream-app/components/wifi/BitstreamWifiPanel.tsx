import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BITSTREAM_CAPS_FLAG_WIFI_CHANNEL } from "../../../../bitstream/wifi/bitstream-wifi-channel";
import {
  resolveWcmSecurityUint32,
  WCM_SECURITY_PRESET_DEFAULT_KEY,
} from "../../../../bitstream/wifi/wifi-wcm-security";
import { useBitstreamAppControl } from "../../BitstreamAppWrapper";
import { useBitstreamLiveStore } from "../../state/bitstreamLive.store";
import { useBitstreamWifiStore } from "../../state/bitstreamWifi.store";
import { useBitstreamConnectionStore } from "../../state/bitstreamConnection.store";
import { WifiConnectionControlCard } from "./WifiConnectionControlCard";
import { WifiDiagnosticsCard } from "./WifiDiagnosticsCard";
import { WifiDetailsCard } from "./WifiDetailsCard";
import { WifiRssiTrendCard } from "./WifiRssiTrendCard";
import { WifiStatusSummaryCard } from "./WifiStatusSummaryCard";
import { formatWifiLinkState } from "./wifi-panel-utils";

export function BitstreamWifiPanel(props: { className?: string }) {
  const { className } = props;
  const handshakeState = useBitstreamLiveStore((s) => s.handshakeState);
  const capsFlags = useBitstreamLiveStore((s) => s.handshake?.capsFlags ?? 0);
  const wifiAdvertised = (capsFlags & BITSTREAM_CAPS_FLAG_WIFI_CHANNEL) !== 0;

  const lastStatus = useBitstreamWifiStore((s) => s.lastStatus);
  const lastScanComplete = useBitstreamWifiStore((s) => s.lastScanComplete);
  const lastUpdatedAt = useBitstreamWifiStore((s) => s.lastUpdatedAt);
  const statusSource = useBitstreamWifiStore((s) => s.lastStatusSource);
  const autoConnectEnabled = useBitstreamWifiStore((s) => s.autoConnectEnabled);
  const lastTx = useBitstreamWifiStore((s) => s.lastTx);
  const lastRx = useBitstreamWifiStore((s) => s.lastRx);
  const wifiSync = useBitstreamWifiStore((s) => s.wifiSync);
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

  const [ssid, setSsid] = useState(() => (import.meta.env.DEV ? "TERNION" : ""));
  const [password, setPassword] = useState(() => (import.meta.env.DEV ? "111122134" : ""));
  const [securityPresetKey, setSecurityPresetKey] = useState(WCM_SECURITY_PRESET_DEFAULT_KEY);
  const [securityCustomText, setSecurityCustomText] = useState("");
  const [scanFilter, setScanFilter] = useState("");
  const [forceSendWithoutCaps, setForceSendWithoutCaps] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [rssiHistory, setRssiHistory] = useState<number[]>([]);
  const [recentEvents, setRecentEvents] = useState<Array<{ at: number; text: string }>>([]);
  const lastUartEventRef = useRef<string | null>(null);
  const lastHostDiagEventRef = useRef<string | null>(null);

  const disabledReason = useMemo(() => {
    if (handshakeState !== "passed") {
      return "Wait for handshake.";
    }
    return null;
  }, [handshakeState]);

  const capsWarning = useMemo(() => {
    if (handshakeState !== "passed") {
      return null;
    }
    if (!wifiAdvertised) {
      if (lastRx != null) {
        return "CAPS says Wi-Fi is not supported (bit 5 off), but Wi-Fi frames are being received. This usually means the CAPS snapshot is stale (restart the web session to re-handshake). You can still try Connect, but scans/policy may not work on older firmware.";
      }
      return "Firmware CAPS did not advertise Wi-Fi channel (bit 5).";
    }
    return null;
  }, [handshakeState, lastRx, wifiAdvertised]);

  // If Wi‑Fi frames are being received, treat CAPS as effectively supported even if the handshake snapshot is stale.
  const capsEffectivelySupported =
    wifiAdvertised || lastRx != null || forceSendWithoutCaps;
  const capsBlocked = handshakeState === "passed" && !capsEffectivelySupported;

  const blocked = disabledReason !== null || busy !== null;

  const resolvedSecurityUint32 = useMemo(
    () => resolveWcmSecurityUint32(securityPresetKey, securityCustomText),
    [securityPresetKey, securityCustomText],
  );

  const wrap = useCallback(async (label: string, fn: () => Promise<boolean>): Promise<boolean> => {
    setBusy(label);
    try {
      return await fn();
    } finally {
      setBusy(null);
    }
  }, []);

  const pushEvent = useCallback((text: string) => {
    setRecentEvents((prev) => [{ at: Date.now(), text }, ...prev].slice(0, 8));
  }, []);

  const onScanAll = useCallback(async () => {
    if (capsBlocked) {
      pushEvent("Scan all blocked: firmware did not advertise Wi‑Fi CAPS.");
      return;
    }
    const ok = await wrap("Scanning…", async () => wifiScanAll());
    if (ok) {
      pushEvent("Scan all request accepted.");
    } else {
      pushEvent("Scan all request failed.");
    }
  }, [capsBlocked, pushEvent, wifiScanAll, wrap]);

  const onScanFilter = useCallback(async () => {
    if (capsBlocked) {
      pushEvent("Filtered scan blocked: firmware did not advertise Wi‑Fi CAPS.");
      return;
    }
    const f = scanFilter.trim();
    if (!f) {
      return;
    }
    const ok = await wrap("Filtered scan…", async () => wifiScanSsid(f));
    if (ok) {
      pushEvent(`Filtered scan started (${f}).`);
    } else {
      pushEvent(`Filtered scan failed (${f}).`);
    }
  }, [capsBlocked, pushEvent, scanFilter, wifiScanSsid, wrap]);

  const onConnect = useCallback(async () => {
    const s = ssid.trim();
    if (!s) {
      return;
    }
    const security = resolveWcmSecurityUint32(securityPresetKey, securityCustomText);
    const ok = await wrap("Connecting…", async () => wifiConnect(s, password, security));
    if (ok) {
      pushEvent(`Connect accepted (SSID=${s}).`);
    } else {
      pushEvent(`Connect failed (SSID=${s}).`);
    }
  }, [ssid, password, securityPresetKey, securityCustomText, pushEvent, wifiConnect, wrap]);

  const onDisconnect = useCallback(async () => {
    const ok = await wrap("Disconnect…", async () => wifiDisconnect());
    if (ok) {
      pushEvent("Disconnect accepted.");
    } else {
      pushEvent("Disconnect failed.");
    }
  }, [pushEvent, wifiDisconnect, wrap]);

  const onPoll = useCallback(async () => {
    const ok = await wrap("Status poll…", async () => wifiStatusPoll());
    if (ok) {
      pushEvent("Status poll refreshed.");
    } else {
      pushEvent("Status poll failed.");
    }
  }, [pushEvent, wifiStatusPoll, wrap]);

  const onPolicyRefresh = useCallback(async () => {
    if (capsBlocked) {
      pushEvent("Policy poll blocked: firmware did not advertise Wi‑Fi CAPS.");
      return;
    }
    const ok = await wrap("Policy poll…", async () => wifiPolicyGet());
    if (ok) {
      pushEvent("Policy refreshed.");
    } else {
      pushEvent("Policy refresh failed.");
    }
  }, [capsBlocked, pushEvent, wifiPolicyGet, wrap]);

  const onPolicyToggle = useCallback(async () => {
    if (capsBlocked) {
      pushEvent("Policy set blocked: firmware did not advertise Wi‑Fi CAPS.");
      return;
    }
    const next = !(autoConnectEnabled ?? true);
    const ok = await wrap("Applying policy…", async () => wifiPolicySet(next));
    if (ok) {
      pushEvent(`Auto-connect ${next ? "enabled" : "disabled"}.`);
    } else {
      pushEvent("Auto-connect policy change failed.");
    }
  }, [autoConnectEnabled, capsBlocked, pushEvent, wifiPolicyGet, wifiPolicySet, wrap]);

  useEffect(() => {
    if (disabledReason != null) {
      return;
    }
    // no-ACK mode: do not poll policy on mount
  }, [disabledReason, wifiPolicyGet]);

  useEffect(() => {
    if (!lastStatus) {
      return;
    }
    setRssiHistory((prev) => [...prev.slice(-23), lastStatus.rssi]);
    pushEvent(
      `Status: ${formatWifiLinkState(lastStatus.state)}, RSSI ${lastStatus.rssi} dBm, SSID ${
        lastStatus.ssid || "(empty)"
      }.`,
    );
  }, [lastStatus?.corrId, lastStatus?.state, lastStatus?.rssi, lastStatus?.ssid, lastStatus, pushEvent]);

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
    pushEvent(normalized);
  }, [logs, pushEvent]);

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
    pushEvent(`[HOST] ${normalized}`);
  }, [logs, pushEvent]);

  const currentState = lastStatus?.state ?? 0;

  return (
    <section className={`flex flex-col gap-2 text-xs text-zinc-200 ${className ?? ""}`}>
      <WifiStatusSummaryCard
        state={currentState}
        rssi={lastStatus?.rssi ?? -127}
        ssid={lastStatus?.ssid ?? ""}
        reason={lastStatus?.reason ?? 0}
        statusSource={statusSource}
        lastUpdatedAt={lastUpdatedAt}
        autoConnectEnabled={autoConnectEnabled}
        busy={busy}
      />

      {disabledReason ? (
        <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] leading-snug text-amber-200/90">
          {disabledReason}
        </p>
      ) : null}
      <WifiRssiTrendCard rssiHistory={rssiHistory} />

      <WifiConnectionControlCard
        blocked={blocked}
        busy={busy}
        ssid={ssid}
        password={password}
        securityPresetKey={securityPresetKey}
        securityCustomText={securityCustomText}
        resolvedSecurityUint32={resolvedSecurityUint32}
        scanFilter={scanFilter}
        autoConnectEnabled={autoConnectEnabled}
        lastScanTotalCount={lastScanComplete?.totalCount ?? null}
        onSsidChange={setSsid}
        onPasswordChange={setPassword}
        onSecurityPresetChange={setSecurityPresetKey}
        onSecurityCustomTextChange={setSecurityCustomText}
        onScanFilterChange={setScanFilter}
        onConnect={() => void onConnect()}
        onDisconnect={() => void onDisconnect()}
        onPoll={() => void onPoll()}
        onPolicyToggle={() => void onPolicyToggle()}
        onPolicyRefresh={() => void onPolicyRefresh()}
        onScanAll={() => void onScanAll()}
        onScanFilter={() => void onScanFilter()}
      />

      <WifiDetailsCard
        capsWarning={capsWarning}
        statusSource={statusSource}
        lastUpdatedAt={lastUpdatedAt}
        wifiSync={wifiSync}
        lastTx={lastTx}
        lastRx={lastRx}
        forceSendWithoutCaps={forceSendWithoutCaps}
        onForceSendWithoutCapsChange={setForceSendWithoutCaps}
      />

      <WifiDiagnosticsCard recentEvents={recentEvents} />
    </section>
  );
}
