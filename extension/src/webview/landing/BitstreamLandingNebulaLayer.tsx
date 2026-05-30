/*******************************************************************************
 * File Name : BitstreamLandingNebulaLayer.tsx
 *
 * Description : Deep-space nebula canvas — drifting gas clouds and twinkling
 *               stars (ported from t3d-extension WebviewLauncherNebulaLayer).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useEffect, useRef } from "react";

type NebulaCloud = {
  baseX: number;
  baseY: number;
  radius: number;
  orbitRadius: number;
  orbitSpeed: number;
  orbitPhase: number;
  driftX: number;
  driftY: number;
  rotation: number;
  rotSpeed: number;
  colorInner: string;
  colorOuter: string;
};

type StarParticle = {
  x: number;
  y: number;
  depth: number;
  size: number;
  twinkleSpeed: number;
  twinklePhase: number;
  driftAngle: number;
  driftSpeed: number;
};

const NEBULA_PALETTE: ReadonlyArray<{ inner: string; outer: string }> = [
  { inner: "rgba(88, 28, 135, 0.22)", outer: "rgba(88, 28, 135, 0)" },
  { inner: "rgba(14, 116, 144, 0.2)", outer: "rgba(14, 116, 144, 0)" },
  { inner: "rgba(59, 130, 246, 0.16)", outer: "rgba(59, 130, 246, 0)" },
  { inner: "rgba(190, 24, 93, 0.14)", outer: "rgba(190, 24, 93, 0)" },
  { inner: "rgba(45, 212, 191, 0.12)", outer: "rgba(45, 212, 191, 0)" },
];

function prefersReducedMotion(): boolean
{
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function createNebulaClouds(width: number, height: number): NebulaCloud[]
{
  const count = Math.min(9, Math.max(5, Math.floor((width * height) / 180000)));
  const clouds: NebulaCloud[] = [];
  for (let i = 0; i < count; i += 1)
  {
    const palette = NEBULA_PALETTE[i % NEBULA_PALETTE.length];
    const radius = Math.min(width, height) * (0.14 + Math.random() * 0.22);
    clouds.push({
      baseX: width * (0.12 + Math.random() * 0.76),
      baseY: height * (0.08 + Math.random() * 0.55),
      radius,
      orbitRadius: 24 + Math.random() * 72,
      orbitSpeed: 0.00012 + Math.random() * 0.00028,
      orbitPhase: Math.random() * Math.PI * 2,
      driftX: (Math.random() - 0.5) * 0.018,
      driftY: (Math.random() - 0.5) * 0.012,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.00035,
      colorInner: palette.inner,
      colorOuter: palette.outer,
    });
  }
  return clouds;
}

function createStars(width: number, height: number): StarParticle[]
{
  const count = Math.min(220, Math.max(90, Math.floor((width * height) / 9000)));
  const stars: StarParticle[] = [];
  for (let i = 0; i < count; i += 1)
  {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height * 0.72,
      depth: 0.25 + Math.random() * 0.75,
      size: 0.6 + Math.random() * 1.6,
      twinkleSpeed: 0.002 + Math.random() * 0.006,
      twinklePhase: Math.random() * Math.PI * 2,
      driftAngle: Math.random() * Math.PI * 2,
      driftSpeed: 0.008 + Math.random() * 0.035,
    });
  }
  return stars;
}

function drawNebulaCloud(
  ctx: CanvasRenderingContext2D,
  cloud: NebulaCloud,
  timeMs: number,
): void
{
  const t = timeMs * 0.001;
  cloud.rotation += cloud.rotSpeed;
  cloud.baseX += cloud.driftX;
  cloud.baseY += cloud.driftY;

  const orbitAngle = cloud.orbitPhase + t * cloud.orbitSpeed * 1000;
  const x = cloud.baseX + Math.cos(orbitAngle) * cloud.orbitRadius;
  const y = cloud.baseY + Math.sin(orbitAngle) * cloud.orbitRadius * 0.65;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(cloud.rotation + t * 0.04);
  const stretch = 1.15 + Math.sin(t * 0.35 + cloud.orbitPhase) * 0.12;
  ctx.scale(stretch, 1 / stretch);

  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, cloud.radius);
  gradient.addColorStop(0, cloud.colorInner);
  gradient.addColorStop(0.5, cloud.colorOuter);
  gradient.addColorStop(1, cloud.colorOuter);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, cloud.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  star: StarParticle,
  timeMs: number,
): void
{
  const t = timeMs * 0.001;
  const twinkle =
    0.35 +
    0.65 *
      (0.5 +
        0.5 * Math.sin(t * star.twinkleSpeed * 1000 + star.twinklePhase));
  const x =
    star.x + Math.cos(star.driftAngle + t * star.driftSpeed) * star.depth * 18;
  const y =
    star.y +
    Math.sin(star.driftAngle + t * star.driftSpeed * 0.85) * star.depth * 12;

  ctx.fillStyle = `rgba(220, 235, 255, ${twinkle * (0.25 + star.depth * 0.55)})`;
  ctx.beginPath();
  ctx.arc(x, y, star.size * star.depth, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Animated nebula + starfield behind the flow canvas (landing / launcher shell).
 */
export function BitstreamLandingNebulaLayer()
{
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() =>
  {
    const canvas = canvasRef.current;
    if (canvas == null)
    {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (ctx == null)
    {
      return;
    }

    let width = 0;
    let height = 0;
    let dpr = 1;
    let clouds: NebulaCloud[] = [];
    let stars: StarParticle[] = [];

    const resize = () =>
    {
      const parent = canvas.parentElement;
      if (parent == null)
      {
        return;
      }
      dpr = Math.min(2, window.devicePixelRatio || 1);
      width = Math.max(1, Math.floor(parent.clientWidth));
      height = Math.max(1, Math.floor(parent.clientHeight));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      clouds = createNebulaClouds(width, height);
      stars = createStars(width, height);
    };

    const render = (timeMs: number) =>
    {
      ctx.clearRect(0, 0, width, height);
      for (const cloud of clouds)
      {
        drawNebulaCloud(ctx, cloud, timeMs);
      }
      for (const star of stars)
      {
        drawStar(ctx, star, timeMs);
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement != null)
    {
      ro.observe(canvas.parentElement);
    }

    if (prefersReducedMotion())
    {
      render(0);
      return () =>
      {
        ro.disconnect();
      };
    }

    const tick = (now: number) =>
    {
      render(now);
      rafRef.current = window.requestAnimationFrame(tick);
    };
    rafRef.current = window.requestAnimationFrame(tick);

    return () =>
    {
      ro.disconnect();
      if (rafRef.current != null)
      {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  return (
    <div
      className="webview-launcher-nebula pointer-events-none absolute inset-0 z-1 overflow-hidden"
      aria-hidden
    >
      <div className="webview-launcher-nebula__depth absolute inset-0" />
      <canvas
        ref={canvasRef}
        className="webview-launcher-nebula__canvas absolute inset-0 h-full w-full"
      />
      <div className="webview-launcher-nebula__horizon absolute inset-x-0 bottom-0" />
    </div>
  );
}
