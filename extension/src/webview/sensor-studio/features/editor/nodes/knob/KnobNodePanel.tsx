import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import {
  prepareHiDpiCanvas2d,
  resolveStudioCanvasDpr,
} from "../display/canvas-hi-dpi";
import { useStudioCanvasDisplayScale } from "../display/studio-canvas-display-scale";
import {
  coerceKnobConfig,
  gaugeZoneColor,
  type KnobConfig,
} from "../display/gauge-display-config";

function coerceConfig(dc: Record<string, unknown>): KnobConfig {
  return coerceKnobConfig(dc);
}

const DEG = Math.PI / 180;
const START_DEG = 225;
const SWEEP_DEG = 270;

function draw(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  value: number,
  dragging: boolean,
  cfg: KnobConfig,
): void {
  const { min, max, unit, decimals, zones } = cfg;
  const startRad = START_DEG * DEG;
  const sweepRad = SWEEP_DEG * DEG;

  const labelH = 14;
  const cx = w / 2;
  const cy = (h - labelH) * 0.5;
  const r = Math.min(w, h - labelH) * 0.36;

  ctx.clearRect(0, 0, w, h);

  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const valueRad = startRad + t * sweepRad;
  const fillColor = gaugeZoneColor(zones, value, "#22d3ee");

  // track ring
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.18, startRad, startRad + sweepRad);
  ctx.strokeStyle = "rgba(39,39,42,0.9)";
  ctx.lineWidth = r * 0.13;
  ctx.lineCap = "round";
  ctx.stroke();

  // zone arcs on track
  for (const z of zones) {
    const zt0 = (z.from - min) / (max - min);
    const zt1 = (z.to - min) / (max - min);
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.18, startRad + zt0 * sweepRad, startRad + zt1 * sweepRad);
    ctx.strokeStyle = z.color + "55";
    ctx.lineWidth = r * 0.13;
    ctx.stroke();
  }

  // value arc
  if (t > 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.18, startRad, valueRad);
    ctx.strokeStyle = fillColor;
    ctx.lineWidth = r * 0.13;
    ctx.stroke();
  }
  ctx.lineCap = "butt";

  // drag glow
  if (dragging) {
    const grd = ctx.createRadialGradient(cx, cy, r * 0.85, cx, cy, r * 1.55);
    grd.addColorStop(0, fillColor + "33");
    grd.addColorStop(1, fillColor + "00");
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.55, 0, 2 * Math.PI);
    ctx.fillStyle = grd;
    ctx.fill();
  }

  // knob body
  const bodyGrd = ctx.createRadialGradient(cx - r * 0.18, cy - r * 0.18, r * 0.04, cx, cy, r);
  bodyGrd.addColorStop(0, dragging ? "#3a3d50" : "#2e3248");
  bodyGrd.addColorStop(1, "#111115");
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 2 * Math.PI);
  ctx.fillStyle = bodyGrd;
  ctx.fill();
  ctx.strokeStyle = dragging ? fillColor + "99" : "rgba(63,63,70,0.8)";
  ctx.lineWidth = dragging ? 1.5 : 1;
  ctx.stroke();

  // indicator dot
  const dotR = r * 0.1;
  const dotX = cx + Math.cos(valueRad) * r * 0.72;
  const dotY = cy + Math.sin(valueRad) * r * 0.72;
  ctx.beginPath();
  ctx.arc(dotX, dotY, dotR, 0, 2 * Math.PI);
  ctx.fillStyle = fillColor;
  ctx.fill();

  // major tick marks
  for (let i = 0; i <= 5; i++) {
    const angle = startRad + (i / 5) * sweepRad;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * r * 1.30, cy + Math.sin(angle) * r * 1.30);
    ctx.lineTo(cx + Math.cos(angle) * r * 1.44, cy + Math.sin(angle) * r * 1.44);
    ctx.strokeStyle = "rgba(82,82,91,0.7)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // value readout
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `bold ${Math.round(r * 0.38)}px ui-monospace, monospace`;
  ctx.fillStyle = fillColor;
  ctx.fillText(value.toFixed(decimals), cx, cy + r * 0.1);

  if (unit) {
    ctx.font = `${Math.round(r * 0.22)}px ui-monospace, monospace`;
    ctx.fillStyle = "rgba(113,113,122,0.9)";
    ctx.fillText(unit, cx, cy + r * 0.52);
  }

  // bottom label
  ctx.font = `${Math.max(7, Math.round(r * 0.18))}px ui-sans-serif, sans-serif`;
  ctx.fillStyle = "rgba(113,113,122,0.8)";
  ctx.textBaseline = "bottom";
  ctx.fillText("DRAG  ↕  SCROLL", cx, h - 1);
}

type Props = {
  className?: string;
  nodeId: string;
  defaultConfig: Record<string, unknown>;
  updateValue: (nodeId: string, value: number) => void;
  /** React Flow viewport zoom on the canvas; omit (1) in the inspector preview. */
  displayScale?: number;
};

export function KnobNodePanel({
  className,
  nodeId,
  defaultConfig,
  updateValue,
  displayScale: displayScaleOverride,
}: Props) {
  const displayScale = useStudioCanvasDisplayScale(displayScaleOverride);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataRef = useRef({ defaultConfig, displayScale });
  dataRef.current = { defaultConfig, displayScale };

  const draggingRef = useRef(false);
  const dragStartY = useRef(0);
  const dragStartV = useRef(0);

  const rafRef = useRef<number>(0);
  const schedulePaintRef = useRef<() => void>(() => {});

  schedulePaintRef.current = () => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const wrap = wrapRef.current;
      const canvas = canvasRef.current;
      if (!wrap || !canvas) return;
      const wCss = Math.max(1, wrap.clientWidth);
      const hCss = Math.max(1, wrap.clientHeight);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = resolveStudioCanvasDpr(dataRef.current.displayScale);
      prepareHiDpiCanvas2d(canvas, ctx, wCss, hCss, dpr);
      const cfg = coerceConfig(dataRef.current.defaultConfig);
      draw(ctx, wCss, hCss, cfg.value, draggingRef.current, cfg);
    });
  };

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(() => schedulePaintRef.current());
    ro.observe(wrap);
    schedulePaintRef.current();
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, []);

  useLayoutEffect(() => { schedulePaintRef.current(); }, [defaultConfig, displayScale]);

  const applyDelta = useCallback(
    (deltaY: number) => {
      const cfg = coerceConfig(dataRef.current.defaultConfig);
      const range = cfg.max - cfg.min;
      const sensitivity = 120;
      let next = dragStartV.current + (deltaY / sensitivity) * range;
      if (cfg.step > 0) next = Math.round(next / cfg.step) * cfg.step;
      next = Math.max(cfg.min, Math.min(cfg.max, next));
      updateValue(nodeId, next);
      schedulePaintRef.current();
    },
    [nodeId, updateValue],
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const cfg = coerceConfig(dataRef.current.defaultConfig);
      dragStartY.current = e.clientY;
      dragStartV.current = cfg.value;
      draggingRef.current = true;
      schedulePaintRef.current();

      const onMove = (me: MouseEvent) => {
        applyDelta(dragStartY.current - me.clientY);
      };
      const onUp = () => {
        draggingRef.current = false;
        schedulePaintRef.current();
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [applyDelta],
  );

  const onWheelNative = useCallback(
    (e: WheelEvent) => {
      // Knob consumes wheel to change value; ensure the flow canvas does not interpret it as zoom.
      e.preventDefault();
      e.stopPropagation();
      // React Flow (and other listeners) may attach wheel handlers high up; this ensures full cancel.
      (e as any).stopImmediatePropagation?.();

      const cfg = coerceConfig(dataRef.current.defaultConfig);
      const step = cfg.step > 0 ? cfg.step : (cfg.max - cfg.min) / 100;
      let next = cfg.value + (e.deltaY < 0 ? step : -step);
      if (cfg.step > 0) next = Math.round(next / cfg.step) * cfg.step;
      next = Math.max(cfg.min, Math.min(cfg.max, next));
      updateValue(nodeId, next);
      schedulePaintRef.current();
    },
    [nodeId, updateValue],
  );

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    // Capture + non-passive so preventDefault works and canvas zoom never runs.
    wrap.addEventListener("wheel", onWheelNative, { passive: false, capture: true });
    return () => {
      wrap.removeEventListener("wheel", onWheelNative as any, { capture: true } as any);
    };
  }, [onWheelNative]);

  return (
    <div
      ref={wrapRef}
      className={
        className ??
        "nodrag relative box-border min-h-0 min-w-0 h-full w-full overflow-hidden"
      }
      style={{ minHeight: 100, cursor: draggingRef.current ? "ns-resize" : "pointer" }}
      onMouseDown={onMouseDown}
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 block h-full w-full min-h-0 min-w-0"
        aria-hidden
      />
    </div>
  );
}
