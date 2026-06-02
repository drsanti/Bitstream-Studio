import chroma from "chroma-js";
import { useEffect, useMemo, useState } from "react";
import { useBitstreamConfigStore } from "../../state/bitstreamConfig.store.js";
import {
  formatTelemetryDeltaFixed,
  normalizeDeviceBadgeDeltaMs,
  normalizeHostBadgeDeltaMs,
  pickTelemetryBadgeDeltaMs,
  TELEMETRY_DELTA_SLOT_CHARS,
} from "../../utils/telemetryDeltaDisplay.js";

function formatTimeHhMmSsMs(atMs: number | null): string | null {
  if (atMs == null) return null;
  const d = new Date(atMs);
  if (!Number.isFinite(d.getTime())) return null;
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  const ms = String(d.getMilliseconds()).padStart(3, "0");
  return `${hh}:${mm}:${ss}:${ms}`;
}

function getDeltaTextColor(
  deltaMs: number | null,
  expectedIntervalMs: number,
  policy: {
    warnMultiplier: number;
    badMultiplier: number;
    useRamp: boolean;
    goodHex: string;
    warnHex: string;
    badHex: string;
  },
): string | null {
  if (deltaMs == null) return null;
  if (!Number.isFinite(deltaMs) || deltaMs < 0) return null;
  if (!Number.isFinite(expectedIntervalMs) || expectedIntervalMs <= 0) return null;

  const ratio = deltaMs / expectedIntervalMs;
  if (!Number.isFinite(ratio)) return null;

  const warn = Math.max(1, policy.warnMultiplier);
  const bad = Math.max(warn + 0.05, policy.badMultiplier);

  if (ratio >= bad) {
    return policy.badHex;
  }
  if (ratio <= warn) {
    if (!policy.useRamp) return policy.goodHex;
    const denom = Math.max(0.05, warn - 1);
    const t = (Math.max(1, ratio) - 1) / denom;
    return chroma.mix(policy.goodHex, policy.warnHex, Math.max(0, Math.min(1, t)), "lab").hex();
  }
  if (!policy.useRamp) return policy.warnHex;
  const denom = Math.max(0.05, bad - warn);
  const t = (ratio - warn) / denom;
  return chroma.mix(policy.warnHex, policy.badHex, Math.max(0, Math.min(1, t)), "lab").hex();
}

function useWallAgeMsSinceLastAt(lastAtMs: number | null, tickMs: number): number | null {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (typeof lastAtMs !== "number") {
      return;
    }
    setNowMs(Date.now());
    const id = window.setInterval(() => setNowMs(Date.now()), tickMs);
    return () => window.clearInterval(id);
  }, [lastAtMs, tickMs]);

  if (typeof lastAtMs !== "number") {
    return null;
  }
  return Math.max(0, nowMs - lastAtMs);
}

const DELTA_SLOT_CLASS =
  "inline-block text-right whitespace-pre";

function DeltaSlot(props: {
  deltaMs: number | null | undefined;
  color: string | null;
  title: string;
  placeholder?: boolean;
}) {
  const text = formatTelemetryDeltaFixed(props.deltaMs, {
    placeholder: props.placeholder,
  });
  if (text == null) {
    return null;
  }

  return (
    <span
      className={DELTA_SLOT_CLASS}
      style={{
        minWidth: `${TELEMETRY_DELTA_SLOT_CHARS}ch`,
        color: props.color ?? "rgba(161,161,170,0.9)",
      }}
      title={props.title}
    >
      {text}
    </span>
  );
}

export function LastUpdateBadge(props: {
  lastAtMs: number | null;
  /** Device tMs gap between consecutive EVT_SENSOR publishes. */
  interArrivalMs?: number | null;
  /** Host wall-clock gap between consecutive ingested samples. */
  hostInterArrivalMs?: number | null;
  expectedIntervalMs: number;
  className?: string;
}) {
  const { lastAtMs, interArrivalMs, hostInterArrivalMs, expectedIntervalMs, className } = props;
  const badgeMode = useBitstreamConfigStore((s) => s.telemetryUpdateBadgeMode);
  const deltaSource = useBitstreamConfigStore((s) => s.telemetryUpdateDeltaSource);
  const warnMultiplier = useBitstreamConfigStore((s) => s.fusionUpdateDeltaWarnMultiplier);
  const badMultiplier = useBitstreamConfigStore((s) => s.fusionUpdateDeltaBadMultiplier);
  const useRamp = useBitstreamConfigStore((s) => s.fusionUpdateDeltaUseRamp);
  const goodHex = useBitstreamConfigStore((s) => s.fusionUpdateDeltaGoodColorHex);
  const warnHex = useBitstreamConfigStore((s) => s.fusionUpdateDeltaWarnColorHex);
  const badHex = useBitstreamConfigStore((s) => s.fusionUpdateDeltaBadColorHex);

  const colorPolicy = useMemo(
    () => ({
      warnMultiplier,
      badMultiplier,
      useRamp,
      goodHex,
      warnHex,
      badHex,
    }),
    [warnMultiplier, badMultiplier, useRamp, goodHex, warnHex, badHex],
  );

  const wallAgeMs = useWallAgeMsSinceLastAt(lastAtMs, 250);
  const deviceDeltaMs = useMemo(
    () =>
      normalizeDeviceBadgeDeltaMs({
        deviceInterArrivalMs: interArrivalMs,
        wallAgeMs,
      }),
    [interArrivalMs, wallAgeMs],
  );
  const hostDeltaMs = useMemo(
    () => normalizeHostBadgeDeltaMs({ hostInterArrivalMs }),
    [hostInterArrivalMs],
  );
  const displayDeltaMs = useMemo(
    () =>
      pickTelemetryBadgeDeltaMs({
        deltaSource,
        deviceInterArrivalMs: interArrivalMs,
        hostInterArrivalMs,
        wallAgeMs,
      }),
    [deltaSource, interArrivalMs, hostInterArrivalMs, wallAgeMs],
  );

  const timeText = useMemo(() => formatTimeHhMmSsMs(lastAtMs), [lastAtMs]);
  const deviceDtColor = useMemo(
    () => getDeltaTextColor(deviceDeltaMs, expectedIntervalMs, colorPolicy),
    [deviceDeltaMs, expectedIntervalMs, colorPolicy],
  );
  const hostDtColor = useMemo(
    () => getDeltaTextColor(hostDeltaMs, expectedIntervalMs, colorPolicy),
    [hostDeltaMs, expectedIntervalMs, colorPolicy],
  );
  const dtColor = useMemo(
    () => getDeltaTextColor(displayDeltaMs, expectedIntervalMs, colorPolicy),
    [displayDeltaMs, expectedIntervalMs, colorPolicy],
  );

  const singleDtText = useMemo(
    () => formatTelemetryDeltaFixed(displayDeltaMs, { placeholder: false }),
    [displayDeltaMs],
  );

  const showDeltaRow =
    badgeMode === "both" || badgeMode === "delta";

  if (lastAtMs == null) {
    return null;
  }
  if (badgeMode === "off") {
    return null;
  }

  return (
    <span className={"text-[10px] " + (className ?? "")}>
      {badgeMode === "both" || badgeMode === "timestamp" ? (
        <span className="text-zinc-400">{timeText ?? "--:--:--:---"}</span>
      ) : null}
      {showDeltaRow ? (
        <span
          className={
            (badgeMode === "both" ? "ml-2 " : "") +
            "inline-flex items-center whitespace-pre"
          }
        >
          {deltaSource === "both" ? (
            <span className="inline-flex items-center gap-1.5">
              <DeltaSlot
                deltaMs={deviceDeltaMs}
                color={deviceDtColor}
                title="Device firmware tMs inter-arrival"
                placeholder
              />
              <DeltaSlot
                deltaMs={hostDeltaMs}
                color={hostDtColor}
                title="Host receive inter-arrival"
                placeholder
              />
            </span>
          ) : singleDtText != null ? (
            <span
              className={DELTA_SLOT_CLASS}
              style={{
                minWidth: `${TELEMETRY_DELTA_SLOT_CHARS}ch`,
                color: dtColor ?? "rgba(161,161,170,0.9)",
              }}
            >
              {singleDtText}
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
