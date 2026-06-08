import { Activity, LoaderCircle, Lock, Radio, SlidersHorizontal, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BITSTREAM_CAPS_FLAG_LOG_LEVEL_CONTROL } from "../../../../bitstream2/protocol/caps-flags";
import { useBitstreamAppControl } from "../../BitstreamAppWrapper";
import { useBitstreamLiveStore } from "../../state/bitstreamLive.store";
import { useBitstreamConfigStore } from "../../state/bitstreamConfig.store";
import { TRNCard } from "../../../ui/TRN/TRNCard";
import { TRNGlassButton } from "../../../ui/TRN/TRNGlassButton";
import { TRNSelect } from "../../../ui/TRN/TRNSelect";
import { TRNToggleSwitch } from "../../../ui/TRN/TRNToggleSwitch";
import { TRNHintText } from "../../../ui/TRN/TRNHintText";
import { TRN_GLASS_DROPDOWN_TEXT_CLASS } from "../../../ui/components/toolbar-header-dropdown-menu-ui.js";

function describeLogLevelError(errorCode: number | null, fallback: string): string {
  if (errorCode === 0x01) {
    return "Firmware rejected log-level request due to invalid payload length.";
  }
  if (errorCode === 0x02) {
    return "Firmware rejected log-level request due to invalid value.";
  }
  return fallback;
}

function humanizeLogLevelErrorMessage(raw: string | null | undefined): {
  userMessage: string;
  technical?: string;
} {
  const msg = raw ?? "Unknown error";
  const timeoutMatch = msg.match(
    /^Request timed out after\s+(\d+)\s+attempts?\s+\(requestId=(.+?)\)\s*$/i,
  );
  if (timeoutMatch) {
    const attempts = timeoutMatch[1] ?? "";
    const requestId = timeoutMatch[2] ?? "";
    return {
      userMessage: "No response from firmware. Please wait a moment and try again.",
      technical: `Attempts: ${attempts}\nRequest ID: ${requestId}`,
    };
  }
  if (/timed out/i.test(msg)) {
    return {
      userMessage: "No response from firmware. Please wait a moment and try again.",
      technical: msg,
    };
  }
  return { userMessage: msg, technical: msg };
}

function formatTime(ts: number | null): string {
  if (ts == null) {
    return "—";
  }
  const d = new Date(ts);
  return d.toLocaleTimeString();
}

type FirmwareLogLevelEvent = {
  atMs: number;
  line: string;
  raw?: string;
};

function levelLabel(level: number | null | undefined): string {
  if (level == null) {
    return "—";
  }
  if (level === 0) return "OFF";
  if (level === 1) return "ERROR";
  if (level === 2) return "WARN";
  if (level === 3) return "INFO";
  if (level === 4) return "DEBUG";
  if (level === 5) return "VERBOSE";
  return String(level);
}

const LOG_LEVEL_OPTIONS: Array<{ value: string; label: string; level: number }> = [
  { value: "0", label: "OFF", level: 0 },
  { value: "1", label: "ERROR", level: 1 },
  { value: "2", label: "WARN", level: 2 },
  { value: "3", label: "INFO", level: 3 },
  { value: "4", label: "DEBUG", level: 4 },
  { value: "5", label: "VERBOSE", level: 5 },
];

export function FirmwareLogLevelPanel() {
  const handshakeState = useBitstreamLiveStore((s) => s.handshakeState);
  const capsFlags = useBitstreamLiveStore((s) => s.handshake?.capsFlags ?? 0);
  const logLevelCapabilityAdvertised =
    (capsFlags & BITSTREAM_CAPS_FLAG_LOG_LEVEL_CONTROL) !== 0;
  const confirmationMode = useBitstreamConfigStore((s) => s.commandConfirmationMode);
  const firmwareLogLevelUi = useBitstreamConfigStore((s) => s.firmwareLogLevelUi);
  const setFirmwareLogLevelUi = useBitstreamConfigStore((s) => s.setFirmwareLogLevelUi);
  const firmwareLogLevelAutoEnabled = useBitstreamConfigStore((s) => s.firmwareLogLevelAutoEnabled);
  const setFirmwareLogLevelAutoEnabled = useBitstreamConfigStore((s) => s.setFirmwareLogLevelAutoEnabled);
  const setFirmwareLogLevelUserLocked = useBitstreamConfigStore((s) => s.setFirmwareLogLevelUserLocked);
  const [logLevel, setLogLevel] = useState<number>(firmwareLogLevelUi);
  const [busy, setBusy] = useState<string | null>(null);
  const [logLevelUnsupported, setLogLevelUnsupported] = useState(false);
  const [logLevelBlockedByMode, setLogLevelBlockedByMode] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [reportedLevel, setReportedLevel] = useState<number | null>(null);
  const [reportedAtMs, setReportedAtMs] = useState<number | null>(null);
  const [lastCommandLine, setLastCommandLine] = useState<string>("—");
  const [lastCommandAtMs, setLastCommandAtMs] = useState<number | null>(null);
  const [events, setEvents] = useState<FirmwareLogLevelEvent[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsRaw, setDetailsRaw] = useState<string | null>(null);
  const { getFirmwareLogLevel, setFirmwareLogLevel } = useBitstreamAppControl();

  const blocked = handshakeState !== "passed" || busy !== null;
  const waitingHandshake = handshakeState !== "passed";
  const processing = !waitingHandshake && busy != null;
  const statusIconClass = waitingHandshake
    ? "h-3.5 w-3.5 text-amber-200"
    : processing
      ? "h-3.5 w-3.5 text-sky-200"
      : "h-3.5 w-3.5 text-zinc-300";
  const statusLabel =
    waitingHandshake
      ? "Waiting for handshake"
      : processing
        ? busy
        : "Ready";
  const statusTone = waitingHandshake ? "warn" : processing ? "active" : "ok";
  const statusChip =
    waitingHandshake ? (
      <Lock className="h-3.5 w-3.5 text-amber-200" aria-hidden />
    ) : processing ? (
      <LoaderCircle className="h-3.5 w-3.5 animate-spin text-sky-200" aria-hidden />
    ) : (
      <Radio className="h-3.5 w-3.5 text-zinc-300" aria-hidden />
    );

  const topLevel = levelLabel(reportedLevel);
  const topUpdated = formatTime(reportedAtMs);
  const compactEvents = events.slice(0, 3);

  const pushEvent = useCallback((line: string, raw?: unknown) => {
    const atMs = Date.now();
    setEvents((prev) => {
      const next: FirmwareLogLevelEvent[] = [
        { atMs, line, raw: raw != null ? JSON.stringify(raw) : undefined },
        ...prev,
      ];
      return next.slice(0, 10);
    });
  }, []);

  const detailsText = useMemo(() => {
    if (!detailsRaw) {
      return null;
    }
    return (
      <div className="whitespace-pre-wrap wrap-break-word font-mono text-[12px] text-zinc-200">
        {detailsRaw}
      </div>
    );
  }, [detailsRaw]);

  const onRead = useCallback(async () => {
    setBusy("Reading...");
    try {
      const result = await getFirmwareLogLevel();
      if (result.ok && result.level != null) {
        setLogLevel(result.level);
        setFirmwareLogLevelUi(result.level);
        setLogLevelUnsupported(false);
        setLogLevelBlockedByMode(false);
        setReportedLevel(result.level);
        setReportedAtMs(Date.now());
        setLastSyncedAt(Date.now());
        setLastCommandLine("Refresh → OK");
        setLastCommandAtMs(Date.now());
        pushEvent(`CPU → level=${levelLabel(result.level)}`, result);
        setDetailsRaw(JSON.stringify(result, null, 2));
        return;
      }
      if (result.unsupported) {
        const msg = result.errorMessage ?? "";
        const isModeBlock = msg.toLowerCase().includes("fast mode");
        setLogLevelBlockedByMode(isModeBlock);
        setLogLevelUnsupported(!isModeBlock);
        setLastCommandLine(isModeBlock ? "Refresh → Blocked (Fast mode)" : "Refresh → Unsupported");
        setLastCommandAtMs(Date.now());
        pushEvent(isModeBlock ? "Host → blocked (Fast mode)" : "CPU → unsupported (no log-level control)", result);
        setDetailsRaw(JSON.stringify(result, null, 2));
        return;
      }
      const { userMessage } = humanizeLogLevelErrorMessage(result.errorMessage);
      setLastCommandLine(`Refresh → ${userMessage}`);
      setLastCommandAtMs(Date.now());
      pushEvent("CPU → read failed", result);
      setDetailsRaw(JSON.stringify(result, null, 2));
    } finally {
      setBusy(null);
    }
  }, [getFirmwareLogLevel, setFirmwareLogLevelUi]);

  const onApply = useCallback(async () => {
    setBusy("Applying...");
    try {
      const result = await setFirmwareLogLevel(logLevel);
      if (result.ok && result.level != null) {
        setLogLevel(result.level);
        setFirmwareLogLevelUi(result.level);
        setFirmwareLogLevelUserLocked(true);
        setLogLevelUnsupported(false);
        setLogLevelBlockedByMode(false);
        setReportedLevel(result.level);
        setReportedAtMs(Date.now());
        setLastSyncedAt(Date.now());
        const suffix = confirmationMode === "fast" ? "SENT" : "ACK OK";
        setLastCommandLine(`Apply → ${suffix} (level=${levelLabel(result.level)})`);
        setLastCommandAtMs(Date.now());
        pushEvent(
          `Host → set=${levelLabel(logLevel)} (${confirmationMode === "fast" ? "sent" : "ACK OK"})`,
          { desiredLevel: logLevel, ...result },
        );
        pushEvent(`CPU → level=${levelLabel(result.level)}`, result);
        setDetailsRaw(JSON.stringify({ desiredLevel: logLevel, ...result }, null, 2));
        return;
      }
      if (result.unsupported) {
        const msg = result.errorMessage ?? "";
        const isModeBlock = msg.toLowerCase().includes("fast mode");
        setLogLevelBlockedByMode(isModeBlock);
        setLogLevelUnsupported(!isModeBlock);
        setLastCommandLine(isModeBlock ? "Apply → Blocked (Fast mode)" : "Apply → Unsupported");
        setLastCommandAtMs(Date.now());
        pushEvent(
          isModeBlock
            ? `Host → set=${levelLabel(logLevel)} (blocked)`
            : `Host → set=${levelLabel(logLevel)} (unsupported)`,
          { desiredLevel: logLevel, ...result },
        );
        setDetailsRaw(JSON.stringify({ desiredLevel: logLevel, ...result }, null, 2));
        return;
      }
      const { userMessage } = humanizeLogLevelErrorMessage(result.errorMessage);
      setLastCommandLine(`Apply → ${userMessage}`);
      setLastCommandAtMs(Date.now());
      pushEvent(`Host → set=${levelLabel(logLevel)} (failed)`, { desiredLevel: logLevel, ...result });
      setDetailsRaw(JSON.stringify({ desiredLevel: logLevel, ...result }, null, 2));
    } finally {
      setBusy(null);
    }
  }, [logLevel, setFirmwareLogLevel, setFirmwareLogLevelUi, setFirmwareLogLevelUserLocked]);

  useEffect(() => {
    if (handshakeState !== "passed") {
      return;
    }
    // no-ACK mode: do not auto-read (reads require ACK)
  }, [handshakeState, onRead]);

  return (
    <TRNCard
      title="Global Firmware Logging"
      icon={<SlidersHorizontal className="h-4 w-4" />}
      mode="simple"
      collapsible={false}
      glass
      glassPreset="medium"
      contentClassName="flex min-h-[170px] flex-col gap-2 p-2"
    >
      {/* Status strip (non-technical) */}
      <div
        className={`flex items-center justify-between rounded border px-2 py-1 text-xs ${
          statusTone === "warn"
            ? "border-amber-500/35 bg-amber-500/12 text-amber-100"
            : statusTone === "active"
              ? "border-sky-500/35 bg-sky-500/12 text-sky-100"
              : "border-zinc-700/80 bg-zinc-900/55 text-zinc-300"
        }`}
      >
        <span className="inline-flex items-center gap-1.5">
          {statusChip}
          {statusLabel}
        </span>
        <span className="text-[10px] uppercase tracking-wide text-zinc-400">
          {waitingHandshake ? "Blocked" : processing ? "Processing" : "Idle"}
        </span>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-md border border-zinc-700/80 bg-zinc-900/55 p-2">
          <div className="mb-1 flex items-center gap-1 text-zinc-400">
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
            <span className="text-[10px] uppercase tracking-wide">Level</span>
          </div>
          <p className="text-sm font-semibold text-zinc-100">{topLevel}</p>
        </div>
        <div className="rounded-md border border-zinc-700/80 bg-zinc-900/55 p-2">
          <div className="mb-1 flex items-center gap-1 text-zinc-400">
            <Activity className="h-3.5 w-3.5" aria-hidden />
            <span className="text-[10px] uppercase tracking-wide">Updated</span>
          </div>
          <p className="text-sm font-semibold text-zinc-100">{topUpdated}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3 rounded border border-zinc-700/70 bg-zinc-950/40 px-2 py-1 text-[11px] text-zinc-300">
          <span className="min-w-0">
            <span className="font-semibold text-zinc-200">Auto</span>{" "}
            <span className="text-zinc-400">(boot uses higher verbosity, stable switches to WARN)</span>
          </span>
          <TRNToggleSwitch
            checked={firmwareLogLevelAutoEnabled}
            aria-label="Toggle automatic firmware log level"
            disabled={blocked}
            onCheckedChange={(next) => {
              setFirmwareLogLevelAutoEnabled(next);
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <div className="min-w-36">
            <TRNSelect
              ariaLabel="Firmware log level"
              size="sm"
              value={String(logLevel)}
              options={LOG_LEVEL_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              disabled={blocked || logLevelUnsupported}
              onValueChange={(value) => {
                const next = Number(value);
                setLogLevel(next);
                setFirmwareLogLevelUi(next);
              }}
              buttonClassName={`h-7 min-w-36 border-zinc-600/80 bg-zinc-950/80 px-2 text-zinc-100 shadow-none backdrop-blur-none ${TRN_GLASS_DROPDOWN_TEXT_CLASS}`}
              panelClassName="border border-zinc-700/70"
            />
          </div>
          <TRNGlassButton
            type="button"
            size="sm"
            className="min-w-16 text-[11px]"
            onClick={() => void onApply()}
            disabled={blocked || logLevelUnsupported}
          >
            Apply
          </TRNGlassButton>
          <TRNGlassButton
            type="button"
            size="sm"
            className="min-w-16 text-[11px]"
            onClick={() => void onRead()}
            disabled={blocked || logLevelUnsupported}
          >
            Refresh
          </TRNGlassButton>
        </div>
      </div>

      <TRNHintText className="text-zinc-500">Diagnostics (last action, recent events) are in Details.</TRNHintText>

      {/* Technical details (collapsed by default) */}
      <TRNCard
        title="Details"
        icon={<TriangleAlert className="h-4 w-4" />}
        mode="simple"
        collapsible
        defaultExpanded={false}
        glass
        glassPreset="medium"
        contentClassName="space-y-2 p-2"
      >
        {waitingHandshake ? (
          <TRNHintText tone="warn">
            Handshake has not passed yet. Log-level reads and confirmed writes may fail until handshake is ready.
          </TRNHintText>
        ) : null}

        {logLevelUnsupported ? (
          <TRNHintText tone="warn">Firmware does not support LOG_LEVEL GET/SET yet.</TRNHintText>
        ) : logLevelBlockedByMode ? (
          <TRNHintText tone="warn">
            Fast mode disables ACK-confirmed LOG_LEVEL reads. Switch to Auto/Reliable for Refresh.
          </TRNHintText>
        ) : !logLevelCapabilityAdvertised ? (
          <TRNHintText>
            CAPS did not advertise log-level control; fallback probe is enabled.
          </TRNHintText>
        ) : null}

        <TRNHintText>
          <span className="font-semibold text-zinc-200">Refresh</span> reads the current runtime log
          level from the device (ACK-confirmed in Auto/Reliable).{" "}
          <span className="font-semibold text-zinc-200">Apply</span> sets the level immediately.
        </TRNHintText>

        <TRNHintText tone="info">
          In <span className="font-semibold text-zinc-100">Fast</span> mode, commands are{" "}
          <span className="font-semibold text-zinc-100">sent without waiting for ACK</span>. Use{" "}
          <span className="font-semibold text-zinc-100">Reliable</span> to confirm firmware replies.
        </TRNHintText>

        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">Status (technical)</p>
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded border border-zinc-700/70 bg-zinc-950/40 px-2 py-1 text-[11px] text-zinc-300">
            <div className="text-zinc-500">Current:</div>
            <div className="min-w-0 truncate font-semibold text-zinc-200">{levelLabel(reportedLevel)}</div>
            <div className="text-zinc-500">Updated:</div>
            <div className="min-w-0 truncate">{formatTime(reportedAtMs)}</div>
            <div className="text-zinc-500">Source:</div>
            <div className="min-w-0 truncate">firmware log-level status</div>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">Last action</p>
          <div className="flex items-center justify-between gap-2 rounded border border-zinc-700/70 bg-zinc-950/40 px-2 py-1 text-[11px] text-zinc-300">
            <span className="min-w-0 truncate">{lastCommandLine}</span>
            <span className="shrink-0 text-zinc-500">{formatTime(lastCommandAtMs)}</span>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">Recent (compact)</p>
          <div className="rounded border border-zinc-700/70 bg-zinc-950/40 px-2 py-1 text-[11px] text-zinc-300">
            {compactEvents.length === 0 ? (
              <div className="text-zinc-500">—</div>
            ) : (
              <ul className="space-y-0.5">
                {compactEvents.map((e) => (
                  <li key={`${e.atMs}-${e.line}`} className="flex gap-2">
                    <span className="shrink-0 text-zinc-500">{formatTime(e.atMs)}</span>
                    <span className="min-w-0 wrap-break-word">{e.line}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">Recent events (full)</p>
          <div className="max-h-32 overflow-auto rounded border border-zinc-700/70 bg-zinc-950/40 px-2 py-1 text-[11px] text-zinc-300">
            {events.length === 0 ? (
              <div className="text-zinc-500">—</div>
            ) : (
              <ul className="space-y-0.5">
                {events.map((e) => (
                  <li key={`${e.atMs}-${e.line}`} className="flex gap-2">
                    <span className="shrink-0 text-zinc-500">{formatTime(e.atMs)}</span>
                    <span className="min-w-0 wrap-break-word">{e.line}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {detailsText ? (
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">Raw result</p>
            <div className="rounded border border-zinc-700/70 bg-black/30 p-2">{detailsText}</div>
          </div>
        ) : null}
      </TRNCard>

      <p className="mt-auto border-t border-zinc-800 pt-1 text-[11px] text-zinc-400">
        Applies to system-wide firmware logging. Last synced: {formatTime(lastSyncedAt)}
      </p>
    </TRNCard>
  );
}
