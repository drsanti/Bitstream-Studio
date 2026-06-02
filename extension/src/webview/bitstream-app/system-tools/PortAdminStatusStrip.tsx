/*******************************************************************************
 * File Name : PortAdminStatusStrip.tsx
 *
 * Description : Link / COM / handshake chips, allowed-port preview, mismatch warning.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.1
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { RefreshCw } from "lucide-react";
import type { HandshakeLifecycleState } from "../state/bitstreamLive.store.js";
import { TRNButton, TRNHintText } from "../../ui/TRN";
import {
  formatPortAdminHandshakeLabel,
  formatPortAdminRefreshAge,
} from "./portAdminFormat.js";

export type PortAdminStatusStripProps = {
  isWsConnected: boolean;
  comOpen: boolean;
  openComPath: string | null;
  handshakeState: HandshakeLifecycleState;
  /** Port Link / auto-connect will use (whitelist + ★ target + drag order). */
  autoConnectPick: string | null;
  autoConnectSummary: string | null;
  whitelistCount: number;
  portCount: number;
  lastUpdatedAt: number | null;
  loading: boolean;
  onRefresh: () => void;
  /** Open COM differs from allowed pick — offer one-click switch. */
  onSwitchToAllowedPort?: () => void;
};

function StatusChip(props: {
  label: string;
  value: string;
  tone?: "ok" | "warn" | "muted" | "bad";
})
{
  const { label, value, tone = "muted" } = props;
  const valueClass =
    tone === "ok"
      ? "text-emerald-300/95"
      : tone === "warn"
        ? "text-amber-300/95"
        : tone === "bad"
          ? "text-rose-300/95"
          : "text-zinc-300";

  return (
    <span className="inline-flex items-center gap-1 text-[11px]">
      <span className="text-zinc-500">{label}:</span>
      <span className={`font-medium ${valueClass}`}>{value}</span>
    </span>
  );
}

function buildAllowListHint(whitelistCount: number, portCount: number): string {
  if (whitelistCount > 0) {
    return `${whitelistCount} port${whitelistCount === 1 ? "" : "s"} allowed for Link · drag order = priority among allowed`;
  }
  if (portCount > 0) {
    return "No ports allowed — turn Allow ON for at least one port, or set ★ active target";
  }
  return "Refresh when a USB/COM device is connected";
}

/**
 * Top summary row for Serial Port Admin (connection + allowed-port preview).
 */
export function PortAdminStatusStrip(props: PortAdminStatusStripProps)
{
  const {
    isWsConnected,
    comOpen,
    openComPath,
    handshakeState,
    autoConnectPick,
    autoConnectSummary,
    whitelistCount,
    portCount,
    lastUpdatedAt,
    loading,
    onRefresh,
    onSwitchToAllowedPort,
  } = props;

  const comLabel = comOpen
    ? openComPath != null && openComPath.length > 0
      ? `${openComPath} open`
      : "open"
    : "closed";

  const comMismatch =
    comOpen &&
    openComPath != null &&
    openComPath.length > 0 &&
    autoConnectPick != null &&
    openComPath !== autoConnectPick;

  const comTone: "ok" | "warn" | "muted" | "bad" = comMismatch
    ? "warn"
    : comOpen
      ? "ok"
      : "muted";

  const handshakeLabel = formatPortAdminHandshakeLabel(handshakeState);
  const handshakeTone =
    handshakeState === "passed"
      ? "ok"
      : handshakeState === "failed"
        ? "bad"
        : handshakeState === "running"
          ? "warn"
          : "muted";

  const allowListHint = buildAllowListHint(whitelistCount, portCount);

  return (
    <div className="flex flex-col gap-1.5 rounded-md border border-zinc-700/55 bg-zinc-950/35 px-2.5 py-2">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <StatusChip
            label="Link"
            value={isWsConnected ? "connected" : "disconnected"}
            tone={isWsConnected ? "ok" : "warn"}
          />
          <StatusChip label="COM" value={comLabel} tone={comTone} />
          <StatusChip label="Handshake" value={handshakeLabel} tone={handshakeTone} />
        </div>
        <div className="inline-flex shrink-0 items-center gap-1.5 text-[11px] text-zinc-400">
          <span>{formatPortAdminRefreshAge(lastUpdatedAt)}</span>
          <button
            type="button"
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border border-zinc-600/75 bg-zinc-900/55 text-zinc-100 transition-colors hover:bg-zinc-800/65 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onRefresh}
            disabled={loading}
            aria-label={loading ? "Refreshing ports" : "Refresh port list"}
            title={loading ? "Refreshing…" : "Refresh port list"}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              aria-hidden
            />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[11px]">
        <span className="text-zinc-500">Next Link port</span>
        <span className="font-mono font-semibold text-cyan-200/95">
          {autoConnectPick ?? (portCount > 0 ? "— (none allowed)" : "no ports")}
        </span>
        {autoConnectSummary != null && autoConnectSummary.length > 0 ? (
          <span className="text-zinc-400">({autoConnectSummary})</span>
        ) : null}
      </div>

      {comMismatch ? (
        <div className="flex flex-wrap items-center gap-2 rounded border border-amber-500/35 bg-amber-950/25 px-2 py-1.5 text-[11px] text-amber-100/95">
          <span>
            Open <span className="font-mono font-semibold">{openComPath}</span> is not the allowed
            target (<span className="font-mono font-semibold">{autoConnectPick}</span>).
          </span>
          {onSwitchToAllowedPort != null ? (
            <TRNButton
              size="compact"
              className="h-6 border-amber-600/50 bg-amber-950/40 text-[10px] text-amber-50 hover:bg-amber-900/40"
              onClick={onSwitchToAllowedPort}
            >
              Switch to {autoConnectPick}
            </TRNButton>
          ) : null}
        </div>
      ) : null}

      <TRNHintText tone="muted">{allowListHint}</TRNHintText>
    </div>
  );
}
