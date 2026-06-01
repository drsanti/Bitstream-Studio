import { twMerge } from "tailwind-merge";
import {
  QuaternionScalarsGrid,
  ReadingAxisNumber,
  ReadingNumber,
  ReadingValueGroup,
} from "../../nodes/flow-node/readings";
import { SOCKET_LIVE_VALUE_TYPOGRAPHY } from "../../nodes/flow-node/readings/socket-live-value-cell";
import type {
  PalettePrimaryBundleRow,
  PalettePreviewStreamTone,
} from "./palette-live-preview";
import { getPaletteScalarReadingColorClass } from "./palette-scalar-reading-styles";
import { PALETTE_ROW_LABEL_TYPOGRAPHY } from "./node-palette-font";

type PalettePrimaryReadingsPreviewProps = {
  streamMode: PalettePreviewStreamTone;
  rows: PalettePrimaryBundleRow[];
  align?: "start" | "end";
  density?: "dense" | "comfortable";
};

function idleStreamClass(streamMode: PalettePreviewStreamTone): string {
  return streamMode === "idle" ? "opacity-45" : "";
}

function textAlignForRow(align: "start" | "end"): "left" | "right" {
  return align === "start" ? "left" : "right";
}

const PRIMARY_BUNDLE_ROW_SHELL_CLASS = "flex min-w-0 items-baseline justify-between gap-2 py-px leading-none";

function PrimaryBundleRow(props: {
  row: PalettePrimaryBundleRow;
  streamMode: PalettePreviewStreamTone;
  align: "start" | "end";
  labelClass: string;
  rowClassName?: string;
}) {
  const { row, streamMode, align, labelClass, rowClassName } = props;
  const textAlign = textAlignForRow(align);
  const rowShellClass = twMerge(PRIMARY_BUNDLE_ROW_SHELL_CLASS, rowClassName);

  if (row.kind === "scalar") {
    const unavailable =
      row.unavailableWhenIdle &&
      streamMode === "idle" &&
      (!Number.isFinite(row.value) || row.value === 0);
    const scalarTone = getPaletteScalarReadingColorClass(streamMode, {
      unit: row.unit,
      label: row.label,
    });
    return (
      <div className={rowShellClass}>
        <span className={labelClass}>{row.label}</span>
        {unavailable ? (
          <span className={twMerge(SOCKET_LIVE_VALUE_TYPOGRAPHY, "shrink-0 text-zinc-600")}>
            <span>—</span>
            {row.unit != null ? (
              <span className={twMerge("ml-0.5 shrink-0", PALETTE_ROW_LABEL_TYPOGRAPHY)}>
                {row.unit}
              </span>
            ) : null}
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-baseline gap-0.5">
            <ReadingNumber
              value={row.value}
              fractionDigits={row.fractionDigits ?? 2}
              signedPositive={row.signedPositive ?? false}
              className={twMerge(SOCKET_LIVE_VALUE_TYPOGRAPHY, "text-right", scalarTone)}
            />
            {row.unit != null ? (
              <span className={twMerge("shrink-0", PALETTE_ROW_LABEL_TYPOGRAPHY)}>{row.unit}</span>
            ) : null}
          </span>
        )}
      </div>
    );
  }

  if (row.kind === "vector3") {
    const fractionDigits = row.handleId === "euler" ? 3 : row.fractionDigits;
    return (
      <div className={rowShellClass}>
        <span className={labelClass}>{row.label}</span>
        <ReadingValueGroup className={twMerge(SOCKET_LIVE_VALUE_TYPOGRAPHY, "gap-x-1 justify-end")}>
          <ReadingAxisNumber
            compact
            socketFixedCell
            textAlign={textAlign}
            axis="x"
            value={row.vector.x}
            fractionDigits={fractionDigits}
          />
          <ReadingAxisNumber
            compact
            socketFixedCell
            textAlign={textAlign}
            axis="y"
            value={row.vector.y}
            fractionDigits={fractionDigits}
          />
          <ReadingAxisNumber
            compact
            socketFixedCell
            textAlign={textAlign}
            axis="z"
            value={row.vector.z}
            fractionDigits={fractionDigits}
          />
        </ReadingValueGroup>
      </div>
    );
  }

  return (
    <div className={rowShellClass}>
      <span className={labelClass}>{row.label}</span>
      <QuaternionScalarsGrid
        compact
        align="end"
        textAlign={textAlign}
        w={row.quaternion.w}
        x={row.quaternion.x}
        y={row.quaternion.y}
        z={row.quaternion.z}
        fractionDigits={row.fractionDigits ?? 3}
      />
    </div>
  );
}

/** Compact multi-row live matrix for primary sensor stream nodes in the library. */
export function PalettePrimaryReadingsPreview(props: PalettePrimaryReadingsPreviewProps) {
  const { streamMode, rows, align = "end", density = "dense" } = props;
  const labelClass = twMerge("shrink-0 truncate max-w-[7.5rem]", PALETTE_ROW_LABEL_TYPOGRAPHY);
  const stackGapClass = density === "dense" ? "gap-0" : "gap-0.5";
  const rowPadClass = density === "dense" ? "py-px" : "py-0.5";

  return (
    <div
      className={twMerge(
        "flex w-full min-w-0 flex-col",
        stackGapClass,
        idleStreamClass(streamMode),
      )}
    >
      {rows.map((row) => (
        <PrimaryBundleRow
          key={row.label}
          row={row}
          streamMode={streamMode}
          align={align}
          labelClass={labelClass}
          rowClassName={rowPadClass}
        />
      ))}
    </div>
  );
}
