/*******************************************************************************
 * File Name : RotationDegPlotter.tsx
 *
 * Description : Canvas line plot for X/Y/Z rotation degrees (simulation telemetry).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useCallback, useEffect, useRef } from "react";
import { twMerge } from "tailwind-merge";

export type RotationPlotSeries = {
  data: readonly number[];
  color: string;
  label: string;
};

export type RotationDegPlotterProps = {
  series: readonly RotationPlotSeries[];
  scrollThreshold?: number;
  className?: string;
  height?: number;
  padding?: number;
  /** When true, redraws every animation frame (for live telemetry). */
  live?: boolean;
};

/**
 * Draws scrolling multi-series line chart (degrees) on a 2D canvas.
 */
export function RotationDegPlotter({
  series,
  scrollThreshold = 256,
  className,
  height = 160,
  padding = 10,
  live = false,
}: RotationDegPlotterProps)
{
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const seriesRef = useRef(series);
  seriesRef.current = series;

  const draw = useCallback(() =>
  {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (canvas == null || container == null)
    {
      return;
    }

    const width = container.clientWidth;
    if (width <= 0)
    {
      return;
    }

    const currentSeries = seriesRef.current;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (ctx == null)
    {
      return;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#09090b";
    ctx.fillRect(0, 0, width, height);

    const plotW = width - padding * 2;
    const plotH = height - padding * 2;
    const visible = currentSeries.map((s) =>
    {
      const slice =
        s.data.length > scrollThreshold
          ? s.data.slice(s.data.length - scrollThreshold)
          : s.data;
      return slice;
    });

    let minY = Infinity;
    let maxY = -Infinity;
    for (const data of visible)
    {
      for (const v of data)
      {
        if (v < minY)
        {
          minY = v;
        }
        if (v > maxY)
        {
          maxY = v;
        }
      }
    }
    if (!Number.isFinite(minY) || !Number.isFinite(maxY))
    {
      minY = -1;
      maxY = 1;
    }
    if (minY === maxY)
    {
      minY -= 1;
      maxY += 1;
    }

    const maxLen = Math.max(1, ...visible.map((d) => d.length));

    for (let si = 0; si < visible.length; si++)
    {
      const data = visible[si];
      if (data.length === 0)
      {
        continue;
      }

      ctx.strokeStyle = currentSeries[si]?.color ?? "#94a3b8";
      ctx.fillStyle = currentSeries[si]?.color ?? "#94a3b8";

      if (data.length === 1)
      {
        const x = padding + plotW / 2;
        const t = (data[0] - minY) / (maxY - minY);
        const y = padding + plotH - t * plotH;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }

      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < data.length; i++)
      {
        const x = padding + (i / Math.max(1, maxLen - 1)) * plotW;
        const t = (data[i] - minY) / (maxY - minY);
        const y = padding + plotH - t * plotH;
        if (i === 0)
        {
          ctx.moveTo(x, y);
        }
        else
        {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.strokeRect(padding, padding, plotW, plotH);
  }, [height, padding, scrollThreshold]);

  useEffect(() =>
  {
    draw();
  }, [draw, series, live]);

  useEffect(() =>
  {
    if (!live)
    {
      return;
    }

    let rafId = 0;
    const loop = (): void =>
    {
      draw();
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () =>
    {
      cancelAnimationFrame(rafId);
    };
  }, [draw, live]);

  useEffect(() =>
  {
    const container = containerRef.current;
    if (container == null)
    {
      return;
    }

    const observer = new ResizeObserver(() =>
    {
      draw();
    });
    observer.observe(container);

    return () =>
    {
      observer.disconnect();
    };
  }, [draw]);

  return (
    <div
      ref={containerRef}
      className={twMerge("w-full rounded-lg bg-zinc-950 ring-1 ring-zinc-800", className)}
    >
      <canvas ref={canvasRef} className="block w-full" />
      <div className="flex flex-wrap gap-3 px-2 pb-2 pt-1 text-[10px] uppercase tracking-wide text-zinc-500">
        {series.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
