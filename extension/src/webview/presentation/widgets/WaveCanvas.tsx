import { useRef, useEffect, useCallback } from "react";

export type WaveChannel = {
  color: string;
  gradFrom?: string;
  gradTo?: string;
  data: Float32Array | number[];
};

function resolveColor(value: string, el: HTMLElement | null): string {
  if (!value.startsWith("var(")) {
    return value;
  }
  const prop = value.slice(4, -1).trim();
  const root = el?.closest(".presentation-root") ?? document.documentElement;
  return getComputedStyle(root).getPropertyValue(prop).trim() || "transparent";
}

export function WaveCanvas({
  channels,
  min = -2,
  max = 2,
  lineWidth = 1.5,
  className = "",
}: {
  channels: WaveChannel[];
  min?: number;
  max?: number;
  lineWidth?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width === 0 || height === 0) {
      return;
    }

    ctx.clearRect(0, 0, width, height);
    const range = max - min;

    for (const ch of channels) {
      if (!ch.data || ch.data.length < 2) {
        continue;
      }
      const n = ch.data.length;
      const xStep = width / (n - 1);
      const getY = (v: number) => height - ((Math.max(min, Math.min(max, v)) - min) / range) * height;

      const resolvedColor = resolveColor(ch.color, container);
      const resolvedGradFrom = resolveColor(ch.gradFrom ?? ch.color, container);
      const resolvedGradTo = resolveColor(ch.gradTo ?? "transparent", container);

      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, resolvedGradFrom);
      grad.addColorStop(1, resolvedGradTo);

      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const x = i * xStep;
        const y = getY(ch.data[i]);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.lineTo((n - 1) * xStep, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.strokeStyle = resolvedColor;
      ctx.lineWidth = lineWidth;
      ctx.lineJoin = "round";
      for (let i = 0; i < n; i++) {
        const x = i * xStep;
        const y = getY(ch.data[i]);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    const zy = height - ((0 - min) / range) * height;
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = resolveColor("var(--surface-border)", container);
    ctx.lineWidth = 1;
    ctx.moveTo(0, zy);
    ctx.lineTo(width, zy);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [channels, min, max, lineWidth]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const ro = new ResizeObserver(() => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext("2d");
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    });

    ro.observe(container);
    return () => ro.disconnect();
  }, [draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div ref={containerRef} className={`relative h-full w-full ${className}`}>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
