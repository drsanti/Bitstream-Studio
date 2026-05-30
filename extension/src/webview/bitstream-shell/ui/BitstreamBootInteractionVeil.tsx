import { Loader2 } from "lucide-react";
import type { HandshakeLifecycleState } from "../../bitstream-app/state/bitstreamLive.store.js";
import type { TransportState } from "../../bitstream-app/state/bitstreamConnection.store.js";

export interface BitstreamBootInteractionVeilProps {
  connected: boolean;
  transportState: TransportState;
  runtimeSyncState: "idle" | "syncing_snapshot" | "ready";
  handshakeState: HandshakeLifecycleState;
}

function veilCopy(props: BitstreamBootInteractionVeilProps): { title: string; subtitle: string } | null {
  const { connected, transportState, runtimeSyncState, handshakeState } = props;
  if (!connected || transportState !== "connected") {
    return null;
  }

  const awaitingBroker =
    runtimeSyncState === "idle" || runtimeSyncState === "syncing_snapshot";
  const awaitingHandshake = handshakeState === "unknown" || handshakeState === "running";

  // Soft-lock UX: handshake progress is shown in the toolbar; do not hard-block the entire app.
  // Keep the veil only for broker snapshot sync where core runtime state is missing.
  if (!awaitingBroker) {
    return null;
  }

  if (awaitingBroker) {
    return {
      title: "Syncing broker runtime state",
      subtitle: "Waiting for serial bridge snapshot on the status channel…",
    };
  }

  if (awaitingHandshake) {
    return null;
  }
  return null;
}

/**
 * Blocks interaction until the broker snapshot is merged and the firmware handshake completes
 * (`passed` or `failed`). Uses `fixed` viewport anchoring so the status panel stays visually centered.
 * Failure removes the veil so error banners and recovery controls stay usable.
 */
export function BitstreamBootInteractionVeil(props: BitstreamBootInteractionVeilProps) {
  const copy = veilCopy(props);
  if (!copy) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 px-4 py-8 backdrop-blur-xs"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex max-h-[min(520px,calc(100vh-4rem))] w-full max-w-md flex-col items-center gap-5 rounded-xl border border-zinc-600/50 bg-zinc-950/92 px-7 py-8 text-center shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
        <Loader2
          className="h-11 w-11 shrink-0 animate-spin text-sky-400/90"
          aria-hidden
        />
        <div className="min-w-0 space-y-2">
          <p className="text-[15px] font-semibold tracking-tight text-white/95">{copy.title}</p>
          <p className="text-[13px] leading-relaxed text-white/70">{copy.subtitle}</p>
        </div>
      </div>
    </div>
  );
}
