import type { StudioPortType } from "../port-accent";
import {
  QuaternionScalarsGrid,
  ReadingAxisNumber,
  ReadingNumber,
  ReadingValueGroup,
} from "./readings";
import {
  getLiveScalarReadingColorClass,
  type LiveReadingStreamTone,
} from "./readings/live-reading-colors";
import { SOCKET_LIVE_VALUE_TYPOGRAPHY } from "./readings/socket-live-value-cell";
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
    const scalarTone = getLiveScalarReadingColorClass(streamMode, {
      handleId,
      nodeId,
      label: portLabel,
    });
    return (
      <ReadingNumber
        value={scalar}
        fractionDigits={2}
        className={twMerge(SOCKET_LIVE_VALUE_TYPOGRAPHY, "block text-right", scalarTone)}
      />
    );
  }

  return null;
}
