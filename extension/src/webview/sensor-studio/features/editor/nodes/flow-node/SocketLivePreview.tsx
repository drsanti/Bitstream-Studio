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
import { resolveReadingAxisFromHandleOrLabel } from "./readings/param-axis-classes";
import { SOCKET_LIVE_VALUE_TYPOGRAPHY } from "./readings/socket-live-value-cell";
import {
  isLikelyModelUrlString,
  modelUrlSocketDisplayLabel,
} from "../animation/model-select-emit-display-name";
import { SocketStructuredWireBadge } from "./SocketStructuredWireBadge";
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
  /** Text alignment for scalar/string previews. Defaults to `right` (classic socket row look). */
  textAlign?: "left" | "right";
  /** When true, positive scalar values get a `+` prefix. Defaults to true for legacy parity. */
  signedPositive?: boolean;
  /** Override fraction digits (number ports only). */
  fractionDigitsOverride?: number;
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
    textAlign = "right",
    signedPositive = true,
    fractionDigitsOverride,
  } = props;

  if (portType === "vector3" && vector3 != null) {
    const fractionDigits = handleId === "euler" ? 3 : 2;
    return (
      <ReadingValueGroup
        data-flow-socket-live-preview
        className={twMerge(SOCKET_LIVE_VALUE_TYPOGRAPHY, "justify-end gap-x-1")}
      >
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
        data-flow-socket-live-preview
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
    const fractionDigits = fractionDigitsOverride ?? resolveLiveScalarReadingFractionDigits(hints);
    const paramAxis = resolveReadingAxisFromHandleOrLabel(handleId, portLabel);
    if (paramAxis != null) {
      return (
        <ReadingAxisNumber
          data-flow-socket-live-preview
          axis={paramAxis}
          value={scalar}
          compact
          socketFixedCell
          textAlign={textAlign}
          fractionDigits={fractionDigits}
          signedPositive={signedPositive}
          className={streamMode === "idle" ? "text-zinc-500" : undefined}
        />
      );
    }
    const scalarTone = getLiveScalarReadingColorClass(streamMode, hints);
    return (
      <ReadingNumber
        data-flow-socket-live-preview
        value={scalar}
        fractionDigits={fractionDigits}
        signedPositive={signedPositive}
        className={twMerge(
          SOCKET_LIVE_VALUE_TYPOGRAPHY,
          "inline-block w-fit",
          textAlign === "left" ? "text-left" : "text-right",
          scalarTone,
        )}
      />
    );
  }

  if (portType === "boolean" && booleanValue !== undefined) {
    return (
      <span
        data-flow-socket-live-preview
        className={twMerge(
          SOCKET_LIVE_VALUE_TYPOGRAPHY,
          "inline-block w-fit text-right font-medium",
          booleanValue ? "text-emerald-300" : "text-zinc-400",
        )}
      >
        {booleanValue ? "true" : "false"}
      </span>
    );
  }

  if (portType === "string" && stringValue !== undefined) {
    const trimmed = stringValue.trim();
    if (trimmed.length === 0) {
      return null;
    }
    const label = isLikelyModelUrlString(trimmed)
      ? modelUrlSocketDisplayLabel(trimmed)
      : trimmed;
    if (label.length === 0) {
      return null;
    }
    return (
      <SocketStructuredWireBadge
        label={label}
        title={stringValue}
        portType="string"
      />
    );
  }

  return null;
}
