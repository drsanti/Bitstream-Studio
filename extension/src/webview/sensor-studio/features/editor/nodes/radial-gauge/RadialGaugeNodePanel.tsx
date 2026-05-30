import { useLayoutEffect, useRef } from "react";

type Zone = { from: number; to: number; color: string };

type RadialGaugeConfig = {
  min: number;
  max: number;
  unit: string;
  decimals: number;
  zones: Zone[];
};

function coerceConfig(dc: Record<string, unknown>): RadialGaugeConfig {
  const min = typeof dc.min === "number" ? dc.min : 0;
  const max = typeof dc.max === "number" ? dc.max : 100;
  const unit = typeof dc.unit === "string" ? dc.unit : "";
  const decimals = typeof dc.decimals === "number" ? Math.max(0, Math.min(6, Math.round(dc.decimals))) : 1;
  const zones: Zone[] = Array.isArray(dc.zones)
    ? (dc.zones as Zone[]).filter(
        (z) => typeof z?.from === "number" && typeof z?.to === "number" && typeof z?.color === "string",
      )
    : [];
  return { min, max, unit, decimals, zones };
}

function zoneColor(zones: Zone[], value: number, fallback: string): string {
  let c = fallback;
  for (const z of zones) {
    if (value >= z.from && value <= z.to) c = z.color;
  }
  return c;
}

const DEG = Math.PI / 180;
const START_DEG = 225;
const SWEEP_DEG = 270;

function draw(
  ctx: CanvasRenderingContext2D,
  wCss: number,
  hCss: number,
  value: number | null,
  cfg: RadialGaugeConfig,
): void {
  const { min, max, unit, decimals, zones } = cfg;
  const startRad = START_DEG * DEG;
  const sweepRad = SWEEP_DEG * DEG;

  const cx = wCss / 2;
  const cy = hCss * 0.52;
  const r = Math.min(wCss, hCss) * 0.40;

  // bg
  ctx.clearRect(0, 0, wCss, hCss);
  ctx.fillStyle = "rgba(9,9,11,0)";
  ctx.fillRect(0, 0, wCss, hCss);

  // faceplate
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 2 * Math.PI);
  ctx.fillStyle = "rgba(24,24,27,0.95)";
  ctx.fill();
  ctx.strokeStyle = "rgba(63,63,70,0.8)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // zone arcs
  for (const z of zones) {
    const t0 = (z.from - min) / (max - min);
    const t1 = (z.to - min) / (max - min);
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.80, startRad + t0 * sweepRad, startRad + t1 * sweepRad);
    ctx.strokeStyle = z.color;
    ctx.lineWidth = r * 0.09;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  // track arc
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.80, startRad, startRad + sweepRad);
  ctx.strokeStyle = "rgba(63,63,70,0.5)";
  ctx.lineWidth = 1;
  ctx.lineCap = "butt";
  ctx.stroke();

  // major ticks + labels
  const majorCount = 5;
  ctx.font = `${Math.round(Math.min(r * 0.16, 10))}px ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i <= majorCount; i++) {
    const angle = startRad + (i / majorCount) * sweepRad;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(cx + cos * r * 0.79, cy + sin * r * 0.79);
    ctx.lineTo(cx + cos * r * 0.92, cy + sin * r * 0.92);
    ctx.strokeStyle = "rgba(161,161,170,0.7)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    const tv = min + (i / majorCount) * (max - min);
    ctx.fillStyle = "rgba(161,161,170,0.75)";
    ctx.fillText(
      Number.isInteger(tv) ? String(tv) : tv.toFixed(1),
      cx + cos * r * 0.63,
      cy + sin * r * 0.63,
    );

    // minor ticks
    for (let j = 1; j <= 4; j++) {
      const mAngle = startRad + ((i + j / 5) / majorCount) * sweepRad;
      if (i === majorCount) break;
      const mc = Math.cos(mAngle), ms = Math.sin(mAngle);
      ctx.beginPath();
      ctx.moveTo(cx + mc * r * 0.87, cy + ms * r * 0.87);
      ctx.lineTo(cx + mc * r * 0.92, cy + ms * r * 0.92);
      ctx.strokeStyle = "rgba(82,82,91,0.7)";
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  }

  // needle
  const v = value != null && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : min;
  const t = (v - min) / (max - min);
  const needleAngle = startRad + t * sweepRad;
  const nColor = zoneColor(zones, v, "#22d3ee");

  const nLen = r * 0.74, nBack = r * 0.16;
  const nc = Math.cos(needleAngle), ns = Math.sin(needleAngle);
  const bc = Math.cos(needleAngle + Math.PI), bs = Math.sin(needleAngle + Math.PI);

  ctx.beginPath();
  ctx.moveTo(cx + bc * nBack, cy + bs * nBack);
  ctx.lineTo(cx + nc * nLen, cy + ns * nLen);
  ctx.strokeStyle = nColor;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.lineCap = "butt";

  // pivot
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.07, 0, 2 * Math.PI);
  ctx.fillStyle = nColor;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.035, 0, 2 * Math.PI);
  ctx.fillStyle = "rgba(24,24,27,1)";
  ctx.fill();

  // value readout
  const valStr = value != null && Number.isFinite(value) ? v.toFixed(decimals) : "—";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `bold ${Math.round(r * 0.28)}px ui-monospace, monospace`;
  ctx.fillStyle = zoneColor(zones, v, "rgba(228,228,231,0.95)");
  ctx.fillText(valStr, cx, cy + r * 0.38);

  if (unit) {
    ctx.font = `${Math.round(r * 0.16)}px ui-monospace, monospace`;
    ctx.fillStyle = "rgba(161,161,170,0.8)";
    ctx.fillText(unit, cx, cy + r * 0.56);
  }
}

type Props = {
  className?: string;
  value: number | null;
  defaultConfig: Record<string, unknown>;
};

export function RadialGaugeNodePanel({ className, value, defaultConfig }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataRef = useRef({ value, defaultConfig });
  dataRef.current = { value, defaultConfig };

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
      const dpr = Math.min(2.5, window.devicePixelRatio || 1);
      canvas.width = Math.round(wCss * dpr);
      canvas.height = Math.round(hCss * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cfg = coerceConfig(dataRef.current.defaultConfig);
      const v = dataRef.current.value;
      draw(ctx, wCss, hCss, v, cfg);
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

  useLayoutEffect(() => { schedulePaintRef.current(); }, [value, defaultConfig]);

  return (
    <div
      ref={wrapRef}
      className={
        className ??
        "relative box-border min-h-0 min-w-0 h-full w-full overflow-hidden"
      }
      style={{ minHeight: 120 }}
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 block h-full w-full min-h-0 min-w-0"
        aria-hidden
      />
    </div>
  );
}
