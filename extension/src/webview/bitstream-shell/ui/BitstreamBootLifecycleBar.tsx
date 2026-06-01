import type { ReactNode } from "react";
import type { HandshakeLifecycleState } from "../../bitstream-app/state/bitstreamLive.store.js";
import type { TransportState } from "../../bitstream-app/state/bitstreamConnection.store.js";
import { LinkLifecycleStrip } from "./LinkLifecycleStrip.js";

export interface BitstreamBootLifecycleBarProps {
  connected: boolean;
  connecting: boolean;
  transportState: TransportState;
  runtimeSyncState: "idle" | "syncing_snapshot" | "ready";
  handshakeState: HandshakeLifecycleState;
  firmwareSensorTruthReady: boolean;
  /** Opens the Connection step-by-step panel (optional step focus). */
  onOpenConnection?: (stepId?: string) => void;
  /** Optional trailing region (e.g. collaborator sync summary). */
  trailingSlot?: ReactNode;
}

/**
 * Compact boot / lifecycle strip: transport, broker snapshot sync, firmware handshake, and
 * cold sensor-truth sync. Shown under the main toolbar for safe-operation awareness.
 */
export function BitstreamBootLifecycleBar(props: BitstreamBootLifecycleBarProps) {
  return (
    <div className="z-20 flex min-h-8 shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-b border-white/10 bg-black/70 px-2 py-1 backdrop-blur-md">
      <LinkLifecycleStrip {...props} />
    </div>
  );
}
