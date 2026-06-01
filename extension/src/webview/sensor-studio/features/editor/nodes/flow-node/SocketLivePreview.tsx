import type { StudioPortType } from "../port-accent";
import {
  QuaternionScalarsGrid,
  ReadingAxisNumber,
  ReadingNumber,
  ReadingValueGroup,
} from "./readings";
import {
  getLiveScalarReadingColorClass,
  resolveLiveScalarReadingFractionDigits,
  type LiveReadingStreamTone,
} from "./readings/live-reading-colors";
import { SOCKET_LIVE_VALUE_TYPOGRAPHY } from "./readings/socket-live-value-cell";
import { truncateSocketStringPreview } from "./truncate-socket-string";
import { twMerge } from "tailwind-merge";

export type SocketLivePreviewProps = {
  portType: StudioPortType;
  /** Handle id for multi-pin sensor nodes (accel, gyro, temp, …). */
  handleId: string;
  /** Catalog node id — resolves semantic tint for tap nodes (`out` handle). */
  nodeId?: string;
  /** Port label from catalog — fallback for unit/label hints. */
  portLabel?: string;
  /** Live vs idle stream — drives semantic tint vs muted neutral. */
  streamMode?: LiveReadingStreamTone;
  vector3?: { x: number; y: number; z: number } | null;
  quaternion?: { w: number; x: number; y: number; z: number } | null;
  scalar?: number | null | undefined;
  booleanValue?: boolean;
  stringValue?: string;
};

/**
 * Compact live readout for a flow socket row — right-aligned toward the port label.
 */
export function SocketLivePreview(props: SocketLivePreviewProps) {
  const {
    portType,
    handleId,
    nodeId,
    portLabel,
    streamMode = "live",
    vector3,
    quaternion,
    scalar,
    booleanValue,
    stringValue,
  } = props;

  if (portType === "vector3" && vector3 != null) {
    const fractionDigits = handleId === "euler" ? 3 : 2;
    return (
      <ReadingValueGroup className={twMerge(SOCKET_LIVE_VALUE_TYPOGRAPHY, "justify-end gap-x-1")}>
        <ReadingAxisNumber
          compact
          socketFixedCell
          axis="x"
          value={vector3.x}
          fractionDigits={fractionDigits}
        />
        <ReadingAxisNumber
          compact
          socketFixedCell
          axis="y"
          value={vector3.y}
          fractionDigits={fractionDigits}
        />
        <ReadingAxisNumber
          compact
          socketFixedCell
          axis="z"
          value={vector3.z}
          fractionDigits={fractionDigits}
        />
      </ReadingValueGroup>
    );
  }

  if (portType === "quaternion" && quaternion != null) {
    return (
      <QuaternionScalarsGrid
        compact
        w={quaternion.w}
        x={quaternion.x}
        y={quaternion.y}
        z={quaternion.z}
        fractionDigits={3}
      />
    );
  }

  if (portType === "number") {
    if (typeof scalar !== "number" || !Number.isFinite(scalar)) {
      return null;
    }
    const hints = { handleId, nodeId, label: portLabel };
    const scalarTone = getLiveScalarReadingColorClass(streamMode, hints);
    const fractionDigits = resolveLiveScalarReadingFractionDigits(hints);
    return (
      <ReadingNumber
        value={scalar}
        fractionDigits={fractionDigits}
        className={twMerge(SOCKET_LIVE_VALUE_TYPOGRAPHY, "block text-right", scalarTone)}
      />
    );
  }

  if (portType === "boolean" && booleanValue !== undefined) {
    return (
      <span
        className={twMerge(
          SOCKET_LIVE_VALUE_TYPOGRAPHY,
          "block text-right font-medium",
          booleanValue ? "text-emerald-300" : "text-zinc-400",
        )}
      >
        {booleanValue ? "true" : "false"}
      </span>
    );
  }

  if (portType === "string" && stringValue !== undefined) {
    return (
      <span
        className={twMerge(
          SOCKET_LIVE_VALUE_TYPOGRAPHY,
          "block max-w-[9rem] truncate text-right text-zinc-200",
        )}
        title={stringValue}
      >
        {truncateSocketStringPreview(stringValue)}
      </span>
    );
  }

  return null;
}
