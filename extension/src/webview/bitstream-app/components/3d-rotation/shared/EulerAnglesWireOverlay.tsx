import { useCallback, useEffect, useRef } from "react";
import { twMerge } from "tailwind-merge";
import { useBmi270FusionEulerWireTapStore } from "../../../state/bmi270FusionEulerWireTap.store.js";
import {
  EULER_OVERLAY_GAP_PX,
  EULER_OVERLAY_HISTORY_LEN,
  EULER_OVERLAY_Y_MAX,
  EULER_OVERLAY_Y_MIN,
  EULER_WIRE_OVERLAY_STROKE_MATTE,
  QUAT_OVERLAY_GAP_PX,
  QUAT_OVERLAY_STRIP_HEIGHT_PX,
} from "./rotationPreviewConstants.js";

type RingMeta = { write: number; filled: number };

type EulerBuffers = {
  pitch: Float32Array;
  roll: Float32Array;
  yaw: Float32Array;
  meta: RingMeta;
};

const EULER_VALUE_TEXT_COLOR = {
  pitch: "rgba(248, 113, 113, 0.95)",
  roll: "rgba(56, 189, 248, 0.95)",
  yaw: "rgba(74, 222, 128, 0.95)",
} as const;

function getLatestRingValue(buf: Float32Array, meta: RingMeta): number | null {
  if (meta.filled <= 0) {
    return null;
  }
  const idx = (meta.write - 1 + buf.length) % buf.length;
  const value = buf[idx];
  return Number.isFinite(value) ? value : null;
}

function formatSignedFixed(value: number, digits: number, unit: string): string {
  const abs = Math.abs(value);
  const sign = value >= 0 ? "+" : "-";
  return `${sign}${abs.toFixed(digits)}${unit}`;
}

function formatEulerValueReadout(valueRad: number | null): string {
  if (valueRad == null) {
    return "--.--° | --.-- rad";
  }
  const valueDeg = (valueRad * 180) / Math.PI;
  return `${formatSignedFixed(valueDeg, 2, "°")} | ${formatSignedFixed(valueRad, 2, " rad")}`;
}

function pushEulerSample(bufs: EulerBuffers, pitch: number, roll: number, yaw: number): void {
  const i = bufs.meta.write;
  const len = bufs.pitch.length;
  bufs.pitch[i] = Number.isFinite(pitch) ? pitch : Number.NaN;
  bufs.roll[i] = Number.isFinite(roll) ? roll : Number.NaN;
  bufs.yaw[i] = Number.isFinite(yaw) ? yaw : Number.NaN;
  bufs.meta.write = (bufs.meta.write + 1) % len;
  bufs.meta.filled = Math.min(len, bufs.meta.filled + 1);
}

function clearEulerBuffers(bufs: EulerBuffers): void {
  bufs.meta.write = 0;
  bufs.meta.filled = 0;
}

function drawEulerStrip(
  ctx: CanvasRenderingContext2D,
  buf: Float32Array,
  meta: RingMeta,
  x0: number,
  y0: number,
  w: number,
  h: number,
  stroke: string,
  label: string,
  valueText: string,
  valueColor: string,
  yMin: number,
  yMax: number,
): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, y0, w, h);
  ctx.clip();

  // Match {@link ViewportTelemetryHud} spark strip background (lighter than legacy dock fill).
  ctx.fillStyle = "rgba(24, 24, 27, 0.55)";
  ctx.fillRect(x0, y0, w, h);

  ctx.fillStyle = "rgba(228, 228, 231, 0.85)";
  ctx.font = "10px ui-sans-serif, system-ui, sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText(label, x0 + 4, y0 + 2);
  ctx.fillStyle = valueColor;
  ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
  ctx.fillText(valueText, x0 + 4, y0 + 13);

  const span = yMax - yMin;
  const zeroY =
    span > 0 ? y0 + h - ((0 - yMin) / span) * (h - 4) - 2 : y0 + h * 0.5;
  ctx.strokeStyle = "rgba(63, 63, 70, 0.55)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0, zeroY);
  ctx.lineTo(x0 + w, zeroY);
  ctx.stroke();

  const n = meta.filled;
  if (n < 2) {
    ctx.restore();
    return;
  }

  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.35;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();

  const start = (meta.write - n + buf.length) % buf.length;
  let penUp = true;
  for (let i = 0; i < n; i++) {
    const v = buf[(start + i) % buf.length];
    const px = x0 + (i / (n - 1)) * w;
    if (!Number.isFinite(v)) {
      penUp = true;
      continue;
    }
    const clamped = Math.min(yMax, Math.max(yMin, v));
    const py = y0 + h - ((clamped - yMin) / span) * (h - 4) - 2;
    if (penUp) {
      ctx.moveTo(px, py);
      penUp = false;
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.stroke();
  ctx.restore();
}

export type EulerAnglesWireLayout = "viewportDock" | "windowFill";

export type EulerAnglesWireOverlayProps = {
  className?: string;
  layout?: EulerAnglesWireLayout;
};

/** Wire-rate sparklines for fusion pitch / roll / yaw (radians), BSX board frame. */
export function EulerAnglesWireOverlay(props: EulerAnglesWireOverlayProps) {
  const { className, layout = "viewportDock" } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const bufsRef = useRef<EulerBuffers>({
    pitch: new Float32Array(EULER_OVERLAY_HISTORY_LEN),
    roll: new Float32Array(EULER_OVERLAY_HISTORY_LEN),
    yaw: new Float32Array(EULER_OVERLAY_HISTORY_LEN),
    meta: { write: 0, filled: 0 },
  });

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const bufs = bufsRef.current;
    if (canvas == null || wrap == null) {
      return;
    }
    const rect = wrap.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cssW = Math.max(1, Math.floor(rect.width));

    const gap =
      layout === "windowFill" ? EULER_OVERLAY_GAP_PX : QUAT_OVERLAY_GAP_PX;
    let cssH: number;
    let band: number;

    if (layout === "windowFill") {
      const availableH = Math.floor(rect.height);
      if (availableH <= 0) {
        return;
      }
      cssH = availableH;
      band = (cssH - 2 * gap) / 3;
      if (!Number.isFinite(band) || band < 2) {
        band = Math.max(1, (cssH - 2 * gap) / 3);
      }
    } else {
      cssH = 3 * QUAT_OVERLAY_STRIP_HEIGHT_PX + 2 * gap;
      band = QUAT_OVERLAY_STRIP_HEIGHT_PX;
    }

    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;

    const ctx = canvas.getContext("2d");
    if (ctx == null) {
      return;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    const meta = bufs.meta;
    const yMin = EULER_OVERLAY_Y_MIN;
    const yMax = EULER_OVERLAY_Y_MAX;

    drawEulerStrip(
      ctx,
      bufs.pitch,
      meta,
      0,
      0,
      cssW,
      band,
      EULER_WIRE_OVERLAY_STROKE_MATTE.pitch,
      "Pitch",
      formatEulerValueReadout(getLatestRingValue(bufs.pitch, meta)),
      EULER_VALUE_TEXT_COLOR.pitch,
      yMin,
      yMax,
    );
    drawEulerStrip(
      ctx,
      bufs.yaw,
      meta,
      0,
      band + gap,
      cssW,
      band,
      EULER_WIRE_OVERLAY_STROKE_MATTE.yaw,
      "Yaw",
      formatEulerValueReadout(getLatestRingValue(bufs.yaw, meta)),
      EULER_VALUE_TEXT_COLOR.yaw,
      yMin,
      yMax,
    );
    drawEulerStrip(
      ctx,
      bufs.roll,
      meta,
      0,
      (band + gap) * 2,
      cssW,
      band,
      EULER_WIRE_OVERLAY_STROKE_MATTE.roll,
      "Roll",
      formatEulerValueReadout(getLatestRingValue(bufs.roll, meta)),
      EULER_VALUE_TEXT_COLOR.roll,
      yMin,
      yMax,
    );
  }, [layout]);

  useEffect(() => {
    const s0 = useBmi270FusionEulerWireTapStore.getState();
    let prevSeq = s0.seq;
    let prevToken = s0.clearToken;
    if (s0.seq > 0) {
      pushEulerSample(bufsRef.current, s0.pitchRad, s0.rollRad, s0.yawRad);
    }
    redraw();

    const unsub = useBmi270FusionEulerWireTapStore.subscribe((state) => {
      if (state.clearToken !== prevToken) {
        prevToken = state.clearToken;
        prevSeq = state.seq;
        clearEulerBuffers(bufsRef.current);
        redraw();
        return;
      }
      if (state.seq !== prevSeq) {
        prevSeq = state.seq;
        if (state.seq > 0) {
          pushEulerSample(
            bufsRef.current,
            state.pitchRad,
            state.rollRad,
            state.yawRad,
          );
        }
        redraw();
      }
    });

    return unsub;
  }, [redraw]);

  useEffect(() => {
    const el = wrapRef.current;
    if (el == null) {
      return undefined;
    }
    const ro = new ResizeObserver(() => {
      redraw();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [redraw]);

  useEffect(() => {
    if (layout !== "windowFill") {
      return undefined;
    }
    const onWinResize = () => {
      redraw();
    };
    window.addEventListener("resize", onWinResize);
    return () => window.removeEventListener("resize", onWinResize);
  }, [layout, redraw]);

  const dockClass =
    layout === "viewportDock"
      ? "pointer-events-none absolute bottom-0 left-0 right-0 z-8 border-t border-zinc-800/90 bg-zinc-950/40"
      : "pointer-events-none relative flex min-h-0 min-w-0 flex-1 flex-col bg-transparent";

  const dockMinH =
    layout === "viewportDock"
      ? 3 * QUAT_OVERLAY_STRIP_HEIGHT_PX + 2 * QUAT_OVERLAY_GAP_PX
      : undefined;

  return (
    <div
      ref={wrapRef}
      style={
        layout === "viewportDock"
          ? { minHeight: dockMinH }
          : { minHeight: 0, height: "100%" }
      }
      className={twMerge(dockClass, className)}
      aria-hidden
    >
      <canvas
        ref={canvasRef}
        className="block h-full max-h-full min-h-0 w-full max-w-full"
      />
    </div>
  );
}
