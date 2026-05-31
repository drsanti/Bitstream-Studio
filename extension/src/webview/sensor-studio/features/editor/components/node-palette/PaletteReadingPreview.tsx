import { twMerge } from "tailwind-merge";
import {
  QuaternionScalarsGrid,
  ReadingAxisNumber,
  ReadingNumber,
  ReadingValueGroup,
} from "../../nodes/flow-node/readings";
import { SOCKET_LIVE_VALUE_TYPOGRAPHY } from "../../nodes/flow-node/readings/socket-live-value-cell";
import type { PalettePreview, PalettePreviewStreamTone } from "./palette-live-preview";
import { NODE_PALETTE_TABULAR_CLASS } from "./node-palette-font";
import { PalettePrimaryReadingsPreview } from "./PalettePrimaryReadingsPreview";
import { getPaletteScalarReadingColorClass } from "./palette-scalar-reading-styles";

type PaletteReadingPreviewProps = {
  preview: PalettePreview;
  /** Library rows align under the title; alternate layouts use end alignment. */
  align?: "start" | "end";
  density?: "dense" | "comfortable";
};

function justifyClass(align: "start" | "end"): string {
  return align === "start" ? "justify-start" : "justify-end";
}

function textAlignForRow(align: "start" | "end"): "left" | "right" {
  return align === "start" ? "left" : "right";
}

/** Dim idle streams without replacing per-axis tints. */
function idleStreamClass(streamMode: PalettePreviewStreamTone): string {
  return streamMode === "idle" ? "opacity-45" : "";
}

/** Line-2 live readout — mirrors {@link SocketLivePreview} typography and axis colors. */
export function PaletteReadingPreview(props: PaletteReadingPreviewProps) {
  const { preview, align = "start", density = "dense" } = props;
  const isDense = density === "dense";
  const textSize = isDense ? "text-[10px] leading-none" : "text-[11px] leading-tight";
  const unitSize = isDense ? "text-[9px]" : "text-[10px]";

  if (preview.kind === "primaryBundle") {
    return (
      <PalettePrimaryReadingsPreview
        streamMode={preview.streamMode}
        rows={preview.rows}
        align={align}
        density={density}
      />
    );
  }

  if (preview.kind === "pulse") {
    const tone = preview.streamMode === "live" ? "text-emerald-400/90" : "text-zinc-500";
    return (
      <span
        className={twMerge(
          "inline-flex items-center gap-1",
          NODE_PALETTE_TABULAR_CLASS,
          textSize,
          tone,
          justifyClass(align),
        )}
        aria-label={preview.streamMode === "live" ? "Live stream" : "Idle stream"}
      >
        <span
          className={twMerge(
            "size-1.5 shrink-0 rounded-full",
            preview.streamMode === "live" ? "animate-pulse bg-emerald-400/90" : "bg-zinc-600",
          )}
          aria-hidden
        />
        <span className="truncate">{preview.label ?? "stream"}</span>
      </span>
    );
  }

  if (preview.kind === "unavailable") {
    return (
      <span
        className={twMerge(
          "inline-flex items-baseline gap-0.5",
          NODE_PALETTE_TABULAR_CLASS,
          textSize,
          "text-zinc-600",
          justifyClass(align),
        )}
        aria-label={preview.unit != null ? `No live ${preview.unit} yet` : "No live value yet"}
      >
        <span>—</span>
        {preview.unit != null ? (
          <span className={twMerge(unitSize, "text-zinc-700")}>{preview.unit}</span>
        ) : null}
      </span>
    );
  }

  if (preview.kind === "scalar") {
    const tone = getPaletteScalarReadingColorClass(preview.streamMode, {
      unit: preview.unit,
    });
    const digitAlign = align === "start" ? "text-left" : "text-right";
    return (
      <span
        className={twMerge(
          "inline-flex items-baseline gap-0.5",
          NODE_PALETTE_TABULAR_CLASS,
          justifyClass(align),
        )}
        aria-label={[preview.value, preview.unit].filter(Boolean).join(" ")}
      >
        <ReadingNumber
          value={preview.value}
          fractionDigits={preview.fractionDigits ?? 2}
          signedPositive={preview.signedPositive ?? true}
          className={twMerge(SOCKET_LIVE_VALUE_TYPOGRAPHY, digitAlign, tone)}
        />
        {preview.unit != null ? (
          <span className={twMerge(unitSize, "opacity-80", tone)}>{preview.unit}</span>
        ) : null}
      </span>
    );
  }

  if (preview.kind === "vector3") {
    const fractionDigits = preview.handleId === "euler" ? 3 : 2;
    const textAlign = textAlignForRow(align);
    return (
      <ReadingValueGroup
        className={twMerge(
          SOCKET_LIVE_VALUE_TYPOGRAPHY,
          "gap-x-1",
          justifyClass(align),
          idleStreamClass(preview.streamMode),
        )}
      >
        <ReadingAxisNumber
          compact
          socketFixedCell
          textAlign={textAlign}
          axis="x"
          value={preview.vector.x}
          fractionDigits={fractionDigits}
        />
        <ReadingAxisNumber
          compact
          socketFixedCell
          textAlign={textAlign}
          axis="y"
          value={preview.vector.y}
          fractionDigits={fractionDigits}
        />
        <ReadingAxisNumber
          compact
          socketFixedCell
          textAlign={textAlign}
          axis="z"
          value={preview.vector.z}
          fractionDigits={fractionDigits}
        />
      </ReadingValueGroup>
    );
  }

  if (preview.kind === "quaternion") {
    return (
      <div className={idleStreamClass(preview.streamMode)}>
        <QuaternionScalarsGrid
          compact
          align={align}
          textAlign={textAlignForRow(align)}
          w={preview.quaternion.w}
          x={preview.quaternion.x}
          y={preview.quaternion.y}
          z={preview.quaternion.z}
          fractionDigits={preview.fractionDigits ?? 3}
        />
      </div>
    );
  }

  // Legacy text fallback (sensor-input demo path if any caller still emits `value`).
  const tone = preview.streamMode === "live" ? "text-zinc-100" : "text-zinc-500";
  return (
    <span
      className={twMerge(
        "inline-flex items-baseline gap-0.5 truncate",
        NODE_PALETTE_TABULAR_CLASS,
        textSize,
        tone,
        justifyClass(align),
      )}
    >
      <span>{preview.text}</span>
      {preview.unit != null ? (
        <span className={twMerge(unitSize, "opacity-80")}>{preview.unit}</span>
      ) : null}
    </span>
  );
}

export function palettePreviewHasReading(preview: PalettePreview): boolean {
  if (preview.kind === "primaryBundle") {
    return preview.rows.length > 0;
  }
  if (preview.kind === "unavailable" && preview.unit == null) {
    return false;
  }
  return true;
}
