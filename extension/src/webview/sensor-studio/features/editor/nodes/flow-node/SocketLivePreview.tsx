import type { StudioPortType } from "../port-accent";
import {
  QuaternionScalarsGrid,
  ReadingAxisNumber,
  ReadingNumber,
  ReadingValueGroup,
} from "./readings";

export type SocketLivePreviewProps = {
  portType: StudioPortType;
  /** Handle id for multi-pin sensor nodes (accel, gyro, temp, …). */
  handleId: string;
  vector3?: { x: number; y: number; z: number } | null;
  quaternion?: { w: number; x: number; y: number; z: number } | null;
  scalar?: number | null | undefined;
};

/**
 * Compact live readout for a flow socket row — right-aligned toward the port label.
 */
export function SocketLivePreview(props: SocketLivePreviewProps) {
  const { portType, handleId, vector3, quaternion, scalar } = props;

  if (portType === "vector3" && vector3 != null) {
    const fractionDigits = handleId === "euler" ? 3 : 2;
    return (
      <ReadingValueGroup className="justify-end gap-x-1 text-[10px]">
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
    return (
      <ReadingNumber
        value={scalar}
        fractionDigits={2}
        className="block text-right text-[10px] text-zinc-100"
      />
    );
  }

  return null;
}
