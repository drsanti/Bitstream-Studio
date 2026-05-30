import { LoaderCircle, Radio, Search, ShieldCheck, Wifi, WifiOff } from "lucide-react";
import { formatWcmSecurityHex, WCM_SECURITY_PRESETS } from "../../../../bitstream/wifi/wifi-wcm-security";
import { TRNCard } from "../../../ui/TRN/TRNCard";
import { TRNGlassButton } from "../../../ui/TRN/TRNGlassButton";
import { resolveWifiBusyStage } from "./wifi-panel-utils";

export function WifiConnectionControlCard(props: {
  blocked: boolean;
  busy: string | null;
  ssid: string;
  password: string;
  securityPresetKey: string;
  securityCustomText: string;
  resolvedSecurityUint32: number;
  scanFilter: string;
  autoConnectEnabled: boolean | null;
  lastScanTotalCount: number | null;
  onSsidChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSecurityPresetChange: (value: string) => void;
  onSecurityCustomTextChange: (value: string) => void;
  onScanFilterChange: (value: string) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onPoll: () => void;
  onPolicyToggle: () => void;
  onPolicyRefresh: () => void;
  onScanAll: () => void;
  onScanFilter: () => void;
}) {
  const {
    blocked,
    busy,
    ssid,
    password,
    securityPresetKey,
    securityCustomText,
    resolvedSecurityUint32,
    scanFilter,
    autoConnectEnabled,
    lastScanTotalCount,
    onSsidChange,
    onPasswordChange,
    onSecurityPresetChange,
    onSecurityCustomTextChange,
    onScanFilterChange,
    onConnect,
    onDisconnect,
    onPoll,
    onPolicyToggle,
    onPolicyRefresh,
    onScanAll,
    onScanFilter,
  } = props;
  const busyStage = resolveWifiBusyStage(busy);
  const busyLabel =
    busyStage === "connecting"
      ? "Processing connect request"
      : busyStage === "disconnecting"
        ? "Processing disconnect request"
        : busyStage === "scanning"
          ? "Scanning for available APs"
          : busyStage === "polling"
            ? "Refreshing status snapshot"
            : busyStage === "policy"
              ? "Applying auto-connect policy"
              : "Idle";

  const busyIcon =
    busyStage === "connecting" ? (
      <Wifi className="h-3.5 w-3.5 animate-pulse" />
    ) : busyStage === "disconnecting" ? (
      <WifiOff className="h-3.5 w-3.5 animate-pulse" />
    ) : busyStage === "scanning" ? (
      <Search className="h-3.5 w-3.5 animate-pulse" />
    ) : busyStage === "idle" ? (
      <Radio className="h-3.5 w-3.5 text-zinc-400" />
    ) : (
      <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
    );

  return (
    <TRNCard
      title="Connection Control"
      icon={<ShieldCheck className="h-4 w-4" />}
      mode="simple"
      collapsible
      defaultExpanded={false}
      glass
      glassPreset="medium"
      contentClassName="space-y-2 p-2"
    >
      <div
        className={`flex items-center justify-between rounded border px-2 py-1 text-xs ${
          busy
            ? "border-sky-500/35 bg-sky-500/12 text-sky-100"
            : "border-zinc-700/80 bg-zinc-900/55 text-zinc-300"
        }`}
      >
        <span className="inline-flex items-center gap-1.5">
          {busyIcon}
          {busy ? busyLabel : "Ready for command"}
        </span>
        <span className="text-[10px] uppercase tracking-wide text-zinc-400">{busy ? "Processing" : "Idle"}</span>
      </div>

      <label className="flex flex-col gap-0.5">
        <span className="text-[10px] uppercase tracking-wide text-zinc-500">SSID</span>
        <input
          value={ssid}
          onChange={(e) => onSsidChange(e.target.value)}
          disabled={blocked}
          className="rounded border border-zinc-600/80 bg-zinc-950/80 px-1.5 py-1 text-xs text-zinc-100"
          autoComplete="off"
          spellCheck={false}
        />
      </label>
      <label className="flex flex-col gap-0.5">
        <span className="text-[10px] uppercase tracking-wide text-zinc-500">Password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          disabled={blocked}
          className="rounded border border-zinc-600/80 bg-zinc-950/80 px-1.5 py-1 text-xs text-zinc-100"
          autoComplete="off"
        />
      </label>
      <label className="flex flex-col gap-0.5">
        <span className="text-[10px] uppercase tracking-wide text-zinc-500">Security type</span>
        <select
          value={securityPresetKey}
          onChange={(e) => onSecurityPresetChange(e.target.value)}
          disabled={blocked}
          className="rounded border border-zinc-600/80 bg-zinc-950/80 px-1.5 py-1 text-xs text-zinc-100"
        >
          {WCM_SECURITY_PRESETS.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </select>
        {securityPresetKey === "custom" ? (
          <input
            value={securityCustomText}
            onChange={(e) => onSecurityCustomTextChange(e.target.value)}
            disabled={blocked}
            placeholder="Decimal or 0x… (WCM cy_wcm_security_t)"
            className="mt-1 rounded border border-zinc-600/80 bg-zinc-950/80 px-1.5 py-1 text-xs text-zinc-100"
            autoComplete="off"
            spellCheck={false}
          />
        ) : null}
        <p className="text-[10px] leading-snug text-zinc-500">
          Sent as <span className="text-zinc-300">{formatWcmSecurityHex(resolvedSecurityUint32)}</span> (
          <span className="font-mono text-zinc-300">{resolvedSecurityUint32}</span> decimal).
        </p>
      </label>

      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        <TRNGlassButton type="button" size="sm" onClick={onConnect} disabled={blocked} className="text-[11px]">
          Connect
        </TRNGlassButton>
        <TRNGlassButton type="button" size="sm" onClick={onDisconnect} disabled={blocked} className="text-[11px]">
          Disconnect
        </TRNGlassButton>
        <TRNGlassButton type="button" size="sm" onClick={onPoll} disabled={blocked} className="text-[11px]">
          Poll status
        </TRNGlassButton>
        <TRNGlassButton type="button" size="sm" onClick={onPolicyToggle} disabled={blocked} className="text-[11px]">
          Auto: {autoConnectEnabled == null ? "?" : autoConnectEnabled ? "On" : "Off"}
        </TRNGlassButton>
        <TRNGlassButton type="button" size="sm" onClick={onPolicyRefresh} disabled={blocked} className="text-[11px]">
          Poll policy
        </TRNGlassButton>
      </div>

      <div className="flex flex-wrap gap-1.5 border-t border-zinc-800 pt-2">
        <TRNGlassButton type="button" size="sm" onClick={onScanAll} disabled={blocked} className="text-[11px]">
          Scan all
        </TRNGlassButton>
      </div>
      <label className="flex flex-col gap-0.5">
        <span className="text-[10px] uppercase tracking-wide text-zinc-500">Scan filter (substring)</span>
        <div className="flex gap-1">
          <input
            value={scanFilter}
            onChange={(e) => onScanFilterChange(e.target.value)}
            disabled={blocked}
            className="min-w-0 flex-1 rounded border border-zinc-600/80 bg-zinc-950/80 px-1.5 py-1 text-xs text-zinc-100"
            autoComplete="off"
          />
          <TRNGlassButton
            type="button"
            size="sm"
            onClick={onScanFilter}
            disabled={blocked || scanFilter.trim().length === 0}
            className="shrink-0 text-[11px]"
          >
            Scan
          </TRNGlassButton>
        </div>
      </label>
      {busy ? <p className="text-[11px] text-sky-300/90">{busy}</p> : null}
      {lastScanTotalCount != null ? <p className="text-[11px] text-zinc-400">Last scan AP count: {lastScanTotalCount}</p> : null}
    </TRNCard>
  );
}
