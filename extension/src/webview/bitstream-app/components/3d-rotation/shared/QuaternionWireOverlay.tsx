import { useCallback, useEffect, useRef } from "react";
import { twMerge } from "tailwind-merge";
import { useBmi270FusionQuatWireTapStore } from "../../../state/bmi270FusionQuatWireTap.store.js";
import {
  QUAT_OVERLAY_CSS_HEIGHT_PX,
  QUAT_OVERLAY_GAP_PX,
  QUAT_OVERLAY_HISTORY_LEN,
  QUAT_OVERLAY_STRIP_HEIGHT_PX,
  QUAT_OVERLAY_Y_MAX,
  QUAT_OVERLAY_Y_MIN,
} from "./rotationPreviewConstants.js";

type RingMeta = { write: number; filled: number };

type QuatBuffers = {
  qx: Float32Array;
  qy: Float32Array;
  qz: Float32Array;
  qw: Float32Array;
  meta: RingMeta;
};

const QUAT_VALUE_TEXT_COLOR = {
  qx: "rgba(248, 113, 113, 0.95)",
  qy: "rgba(74, 222, 128, 0.95)",
  qz: "rgba(96, 165, 250, 0.95)",
  qw: "rgba(232, 121, 249, 0.95)",
} as const;

function getLatestRingValue(buf: Float32Array, meta: RingMeta): number | null {
  if (meta.filled <= 0) {
    return null;
  }
  const idx = (meta.write - 1 + buf.length) % buf.length;
  const value = buf[idx];
  return Number.isFinite(value) ? value : null;
}

function formatSignedQuat(value: number | null): string {
  if (value == null) {
    return "--.--";
  }
  const abs = Math.abs(value);
  const sign = value >= 0 ? "+" : "-";
  return `${sign}${abs.toFixed(2)}`;
}

function pushQuatSample(bufs: QuatBuffers, qx: number, qy: number, qz: number, qw: number): void {
  const i = bufs.meta.write;
  const len = bufs.qx.length;
  bufs.qx[i] = Number.isFinite(qx) ? qx : Number.NaN;
  bufs.qy[i] = Number.isFinite(qy) ? qy : Number.NaN;
  bufs.qz[i] = Number.isFinite(qz) ? qz : Number.NaN;
  bufs.qw[i] = Number.isFinite(qw) ? qw : Number.NaN;
  bufs.meta.write = (bufs.meta.write + 1) % len;
  bufs.meta.filled = Math.min(len, bufs.meta.filled + 1);
}

function clearQuatBuffers(bufs: QuatBuffers): void {
  bufs.meta.write = 0;
  bufs.meta.filled = 0;
}

function drawQuaternionStrip(
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

export type QuaternionWireLayout = "viewportDock" | "windowFill";

export type QuaternionWireOverlayProps = {
  className?: string;
  /**
   * `viewportDock` — bottom strip inside the 3D viewport (legacy).
   * `windowFill` — expands inside a flex-height parent (e.g. TRNWindow body).
   */
  layout?: QuaternionWireLayout;
};

/**
 * Debug overlay: wire-rate time-series of normalized fusion quaternion components ({@link useBmi270FusionQuatWireTapStore}),
 * bypassing UI flush coalescing. Mesh/orientation cards still use throttled snapshots.
 */
export function QuaternionWireOverlay(props: QuaternionWireOverlayProps) {
  const { className, layout = "viewportDock" } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const bufsRef = useRef<QuatBuffers>({
    qx: new Float32Array(QUAT_OVERLAY_HISTORY_LEN),
    qy: new Float32Array(QUAT_OVERLAY_HISTORY_LEN),
    qz: new Float32Array(QUAT_OVERLAY_HISTORY_LEN),
    qw: new Float32Array(QUAT_OVERLAY_HISTORY_LEN),
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

    let cssH: number;
    let gap: number;
    let band: number;
    if (layout === "windowFill") {
      gap = QUAT_OVERLAY_GAP_PX;
      const availableH = Math.floor(rect.height);
      if (availableH <= 0) {
        return;
      }
      // Fill the TRN body exactly so overflow:hidden never clips; qx–qw bands share height evenly.
      cssH = availableH;
      band = (cssH - 3 * gap) / 4;
      if (!Number.isFinite(band) || band < 2) {
        band = Math.max(1, (cssH - 3 * gap) / 4);
      }
    } else {
      cssH = QUAT_OVERLAY_CSS_HEIGHT_PX;
      gap = QUAT_OVERLAY_GAP_PX;
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
    const yMin = QUAT_OVERLAY_Y_MIN;
    const yMax = QUAT_OVERLAY_Y_MAX;

    drawQuaternionStrip(
      ctx,
      bufs.qx,
      meta,
      0,
      0,
      cssW,
      band,
      "#f87171",
      "Qx",
      formatSignedQuat(getLatestRingValue(bufs.qx, meta)),
      QUAT_VALUE_TEXT_COLOR.qx,
      yMin,
      yMax,
    );
    drawQuaternionStrip(
      ctx,
      bufs.qy,
      meta,
      0,
      band + gap,
      cssW,
      band,
      "#4ade80",
      "Qy",
      formatSignedQuat(getLatestRingValue(bufs.qy, meta)),
      QUAT_VALUE_TEXT_COLOR.qy,
      yMin,
      yMax,
    );
    drawQuaternionStrip(
      ctx,
      bufs.qz,
      meta,
      0,
      (band + gap) * 2,
      cssW,
      band,
      "#60a5fa",
      "Qz",
      formatSignedQuat(getLatestRingValue(bufs.qz, meta)),
      QUAT_VALUE_TEXT_COLOR.qz,
      yMin,
      yMax,
    );
    drawQuaternionStrip(
      ctx,
      bufs.qw,
      meta,
      0,
      (band + gap) * 3,
      cssW,
      band,
      "#e879f9",
      "Qw",
      formatSignedQuat(getLatestRingValue(bufs.qw, meta)),
      QUAT_VALUE_TEXT_COLOR.qw,
      yMin,
      yMax,
    );
  }, [layout]);

  useEffect(() => {
    const s0 = useBmi270FusionQuatWireTapStore.getState();
    let prevSeq = s0.seq;
    let prevToken = s0.clearToken;
    if (s0.seq > 0) {
      pushQuatSample(bufsRef.current, s0.qx, s0.qy, s0.qz, s0.qw);
    }
    redraw();

    const unsub = useBmi270FusionQuatWireTapStore.subscribe((state) => {
      if (state.clearToken !== prevToken) {
        prevToken = state.clearToken;
        prevSeq = state.seq;
        clearQuatBuffers(bufsRef.current);
        redraw();
        return;
      }
      if (state.seq !== prevSeq) {
        prevSeq = state.seq;
        if (state.seq > 0) {
          pushQuatSample(bufsRef.current, state.qx, state.qy, state.qz, state.qw);
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

  return (
    <div
      ref={wrapRef}
      style={
        layout === "viewportDock"
          ? { minHeight: QUAT_OVERLAY_CSS_HEIGHT_PX }
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
