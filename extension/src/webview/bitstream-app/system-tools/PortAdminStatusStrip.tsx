/*******************************************************************************
 * File Name : PortAdminStatusStrip.tsx
 *
 * Description : Link / COM / handshake chips, auto-connect preview, whitelist hint.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { RefreshCw } from "lucide-react";
import type { HandshakeLifecycleState } from "../state/bitstreamLive.store.js";
import { TRNHintText } from "../../ui/TRN";
import {
  formatPortAdminHandshakeLabel,
  formatPortAdminRefreshAge,
} from "./portAdminFormat.js";

export type PortAdminStatusStripProps = {
  isWsConnected: boolean;
  comOpen: boolean;
  openComPath: string | null;
  handshakeState: HandshakeLifecycleState;
  autoConnectPick: string | null;
  autoConnectSummary: string | null;
  whitelistCount: number;
  portCount: number;
  lastUpdatedAt: number | null;
  loading: boolean;
  onRefresh: () => void;
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

/**
 * Top summary row for Serial Port Admin (connection + auto-connect preview).
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
  } = props;

  const comLabel = comOpen
    ? openComPath != null && openComPath.length > 0
      ? `${openComPath} open`
      : "open"
    : "closed";

  const handshakeLabel = formatPortAdminHandshakeLabel(handshakeState);
  const handshakeTone =
    handshakeState === "passed"
      ? "ok"
      : handshakeState === "failed"
        ? "bad"
        : handshakeState === "running"
          ? "warn"
          : "muted";

  const whitelistHint =
    whitelistCount > 0
      ? `${whitelistCount} in auto-connect list · drag order = priority`
      : "No auto-connect filter · any port by list order";

  return (
    <div className="flex flex-col gap-1.5 rounded-md border border-zinc-700/55 bg-zinc-950/35 px-2.5 py-2">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <StatusChip
            label="Link"
            value={isWsConnected ? "connected" : "disconnected"}
            tone={isWsConnected ? "ok" : "warn"}
          />
          <StatusChip label="COM" value={comLabel} tone={comOpen ? "ok" : "muted"} />
          <StatusChip label="Handshake" value={handshakeLabel} tone={handshakeTone} />
        </div>
        <div className="inline-flex shrink-0 items-center gap-1.5 text-[11px] text-zinc-400">
          <span className="tabular-nums">
            {formatPortAdminRefreshAge(lastUpdatedAt)}
          </span>
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
        <span className="text-zinc-500">Auto-connect</span>
        <span className="font-mono font-semibold text-cyan-200/95">
          {autoConnectPick ?? (portCount > 0 ? "—" : "no ports")}
        </span>
        {autoConnectSummary != null && autoConnectSummary.length > 0 ? (
          <span className="text-zinc-400">({autoConnectSummary})</span>
        ) : null}
      </div>

      <TRNHintText tone="muted">{whitelistHint}</TRNHintText>
    </div>
  );
}
