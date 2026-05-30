/*******************************************************************************
 * File Name : FlowCanvasBackground.tsx
 *
 * Description : Canvas waves and drifting particles (mouse-reactive). Ported from
 *               T3D flow-canvas-background for Bitstream Studio landing shells.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  wobblePhase: number;
  wobbleSpeed: number;
  flowPhase: number;
  flowFreq: number;
  fill: string;
};

const PARTICLE_PALETTE = [
  "rgba(56, 189, 248, 0.16)",
  "rgba(52, 211, 153, 0.14)",
  "rgba(99, 102, 241, 0.12)",
  "rgba(34, 211, 238, 0.11)",
  "rgba(56, 189, 248, 0.08)",
  "rgba(167, 243, 208, 0.09)",
] as const;

const POINTER_REACH_PX = 140;
const POINTER_PUSH = 1.05;
const PARTICLE_DAMPING = 0.994;
const FLOW_STRENGTH = 0.022;
const BROWNIAN_STRENGTH = 0.028;
const PARTICLE_SEPARATION = 0.035;

type PointerState = {
  x: number;
  y: number;
  active: boolean;
};

export type FlowCanvasBackgroundProps = {
  /** Closest ancestor with this class receives pointer events for particle repulsion. */
  interactionRootClass?: string;
  className?: string;
  /** Multiplier for bubble count (default 1). Landing uses a higher value for denser flow. */
  particleDensity?: number;
};

function prefersReducedMotion(): boolean
{
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function particleCount(width: number, height: number, density = 1): number
{
  const scaled = Math.floor((width * height) / 8500) * density;
  return Math.min(160, Math.max(70, Math.round(scaled)));
}

function randomRadius(): number
{
  const roll = Math.random();
  if (roll < 0.55)
  {
    return 3 + Math.random() * 9;
  }
  if (roll < 0.88)
  {
    return 11 + Math.random() * 16;
  }
  return 26 + Math.random() * 20;
}

function maxSpeedForRadius(radius: number): number
{
  if (radius < 10)
  {
    return 3.6;
  }
  if (radius < 22)
  {
    return 2.6;
  }
  return 1.6;
}

function createParticles(width: number, height: number, density = 1): Particle[]
{
  const count = particleCount(width, height, density);
  const particles: Particle[] = [];
  for (let i = 0; i < count; i += 1)
  {
    const radius = randomRadius();
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.003 + Math.random() * 0.01,
      flowPhase: Math.random() * Math.PI * 2,
      flowFreq: 0.55 + Math.random() * 0.9,
      fill: PARTICLE_PALETTE[i % PARTICLE_PALETTE.length] ?? PARTICLE_PALETTE[0],
    });
  }
  return particles;
}

function drawWaves(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timeMs: number,
): void
{
  const waveConfigs = [
    {
      base: 0.78,
      amp: 22,
      freq: 0.007,
      speed: 0.0009,
      alpha: 0.1,
      color: "56, 189, 248",
    },
    {
      base: 0.84,
      amp: 16,
      freq: 0.009,
      speed: 0.0011,
      alpha: 0.08,
      color: "52, 211, 153",
    },
    {
      base: 0.9,
      amp: 12,
      freq: 0.011,
      speed: 0.0013,
      alpha: 0.06,
      color: "99, 102, 241",
    },
  ] as const;

  for (const wave of waveConfigs)
  {
    ctx.beginPath();
    const y0 = height * wave.base;
    ctx.moveTo(0, height);
    ctx.lineTo(0, y0);
    for (let x = 0; x <= width; x += 6)
    {
      const y =
        y0 +
        Math.sin(x * wave.freq + timeMs * wave.speed) * wave.amp +
        Math.sin(x * wave.freq * 0.45 + timeMs * wave.speed * 1.4) *
          (wave.amp * 0.35);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    const gradient = ctx.createLinearGradient(0, y0 - wave.amp, 0, height);
    gradient.addColorStop(0, `rgba(${wave.color}, ${wave.alpha})`);
    gradient.addColorStop(1, `rgba(${wave.color}, 0)`);
    ctx.fillStyle = gradient;
    ctx.fill();
  }
}

function drawPointerGlow(
  ctx: CanvasRenderingContext2D,
  pointer: PointerState,
): void
{
  if (!pointer.active)
  {
    return;
  }
  const gradient = ctx.createRadialGradient(
    pointer.x,
    pointer.y,
    0,
    pointer.x,
    pointer.y,
    POINTER_REACH_PX * 0.85,
  );
  gradient.addColorStop(0, "rgba(56, 189, 248, 0.09)");
  gradient.addColorStop(0.45, "rgba(52, 211, 153, 0.045)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(pointer.x, pointer.y, POINTER_REACH_PX * 0.85, 0, Math.PI * 2);
  ctx.fill();
}

function drawParticle(
  ctx: CanvasRenderingContext2D,
  particle: Particle,
  timeMs: number,
): void
{
  const wobble =
    Math.sin(timeMs * particle.wobbleSpeed + particle.wobblePhase) * 0.12;
  const r = particle.radius * (1 + wobble);
  const gradient = ctx.createRadialGradient(
    particle.x - r * 0.2,
    particle.y - r * 0.2,
    Math.max(0.5, r * 0.05),
    particle.x,
    particle.y,
    r,
  );
  gradient.addColorStop(0, particle.fill.replace(/[\d.]+\)$/, "0.32)"));
  gradient.addColorStop(0.6, particle.fill);
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.beginPath();
  ctx.arc(particle.x, particle.y, r, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  if (r >= 10)
  {
    ctx.strokeStyle = particle.fill.replace(/[\d.]+\)$/, "0.3)");
    ctx.lineWidth = 0.75;
    ctx.stroke();
  }
}

function applyFlowField(particles: Particle[], timeMs: number): void
{
  const t = timeMs * 0.001;
  for (const particle of particles)
  {
    const ax =
      Math.sin(
        particle.y * 0.014 + t * particle.flowFreq + particle.flowPhase,
      ) * FLOW_STRENGTH;
    const ay =
      Math.cos(
        particle.x * 0.013 + t * particle.flowFreq * 1.15 + particle.flowPhase,
      ) * FLOW_STRENGTH;
    particle.vx += ax;
    particle.vy += ay;
  }
}

function applyBrownianImpulse(particles: Particle[]): void
{
  for (const particle of particles)
  {
    particle.vx += (Math.random() - 0.5) * BROWNIAN_STRENGTH;
    particle.vy += (Math.random() - 0.5) * BROWNIAN_STRENGTH;
  }
}

function applyParticleSeparation(particles: Particle[]): void
{
  for (let i = 0; i < particles.length; i += 1)
  {
    const a = particles[i];
    for (let j = i + 1; j < particles.length; j += 1)
    {
      const b = particles[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const minDist = a.radius + b.radius + 6;
      if (dist < minDist && dist > 0.5)
      {
        const push = ((minDist - dist) / minDist) * PARTICLE_SEPARATION;
        const nx = dx / dist;
        const ny = dy / dist;
        a.vx -= nx * push;
        a.vy -= ny * push;
        b.vx += nx * push;
        b.vy += ny * push;
      }
    }
  }
}

function applyPointerRepulsion(
  particles: Particle[],
  pointer: PointerState,
): void
{
  if (!pointer.active)
  {
    return;
  }
  for (const particle of particles)
  {
    const dx = particle.x - pointer.x;
    const dy = particle.y - pointer.y;
    const dist = Math.hypot(dx, dy);
    const reach = particle.radius + POINTER_REACH_PX;
    if (dist < 1 || dist > reach)
    {
      continue;
    }
    const strength = (1 - dist / reach) ** 2;
    particle.vx += (dx / dist) * strength * POINTER_PUSH;
    particle.vy += (dy / dist) * strength * POINTER_PUSH;
  }
}

function clampParticleSpeed(particle: Particle): void
{
  const maxSpeed = maxSpeedForRadius(particle.radius);
  const speed = Math.hypot(particle.vx, particle.vy);
  if (speed > maxSpeed)
  {
    particle.vx = (particle.vx / speed) * maxSpeed;
    particle.vy = (particle.vy / speed) * maxSpeed;
  }
}

function wrapParticle(
  particle: Particle,
  width: number,
  height: number,
): void
{
  const pad = particle.radius + 2;
  if (particle.x < -pad)
  {
    particle.x = width + pad;
  }
  else if (particle.x > width + pad)
  {
    particle.x = -pad;
  }
  if (particle.y < -pad)
  {
    particle.y = height + pad;
  }
  else if (particle.y > height + pad)
  {
    particle.y = -pad;
  }
}

function stepParticles(
  particles: Particle[],
  width: number,
  height: number,
  pointer: PointerState,
  timeMs: number,
): void
{
  applyFlowField(particles, timeMs);
  applyBrownianImpulse(particles);
  applyParticleSeparation(particles);
  applyPointerRepulsion(particles, pointer);

  for (const particle of particles)
  {
    particle.vx *= PARTICLE_DAMPING;
    particle.vy *= PARTICLE_DAMPING;
    clampParticleSpeed(particle);
    particle.x += particle.vx;
    particle.y += particle.vy;
    wrapParticle(particle, width, height);
  }
}

/**
 * Animated canvas layer: sine waves plus drifting bubbles (pointer-reactive).
 */
export function FlowCanvasBackground({
  interactionRootClass = "t3d-flow-canvas-bg",
  className = "t3d-flow-canvas-bg__canvas pointer-events-none absolute inset-0 h-full w-full",
  particleDensity = 1,
}: FlowCanvasBackgroundProps)
{
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotionRef = useRef(prefersReducedMotion());
  const particleDensityRef = useRef(particleDensity);

  useEffect(() =>
  {
    particleDensityRef.current = particleDensity;
  }, [particleDensity]);

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
    let particles: Particle[] = [];
    let rafId = 0;
    let startMs = performance.now();
    const pointer: PointerState = { x: 0, y: 0, active: false };

    const syncPointerFromEvent = (event: PointerEvent) =>
    {
      const bounds = canvas.parentElement?.getBoundingClientRect();
      if (bounds == null)
      {
        return;
      }
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
      pointer.active = true;
    };

    const resize = () =>
    {
      const parent = canvas.parentElement;
      if (parent == null)
      {
        return;
      }
      const rect = parent.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = createParticles(width, height, particleDensityRef.current);
    };

    const drawFrame = (nowMs: number) =>
    {
      const elapsed = nowMs - startMs;
      const animate = !reducedMotionRef.current;
      ctx.clearRect(0, 0, width, height);
      drawWaves(ctx, width, height, animate ? elapsed : 0);
      if (animate)
      {
        stepParticles(particles, width, height, pointer, elapsed);
      }
      drawPointerGlow(ctx, pointer);
      for (const particle of particles)
      {
        drawParticle(ctx, particle, elapsed);
      }
    };

    const tick = (nowMs: number) =>
    {
      drawFrame(nowMs);
      if (!reducedMotionRef.current)
      {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    resize();
    drawFrame(startMs);

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() =>
        {
          resize();
          if (reducedMotionRef.current)
          {
            drawFrame(performance.now());
          }
        })
        : null;
    ro?.observe(canvas.parentElement ?? canvas);

    const interactionRoot =
      canvas.closest(`.${interactionRootClass}`) ??
      canvas.parentElement ??
      canvas;

    const onPointerMove: EventListener = (event) =>
    {
      if (event instanceof PointerEvent)
      {
        syncPointerFromEvent(event);
      }
    };
    const onPointerLeave = () =>
    {
      pointer.active = false;
    };

    interactionRoot.addEventListener("pointermove", onPointerMove, {
      passive: true,
    });
    interactionRoot.addEventListener("pointerleave", onPointerLeave);
    interactionRoot.addEventListener("pointercancel", onPointerLeave);

    if (!reducedMotionRef.current)
    {
      rafId = window.requestAnimationFrame(tick);
    }

    return () =>
    {
      window.cancelAnimationFrame(rafId);
      ro?.disconnect();
      interactionRoot.removeEventListener("pointermove", onPointerMove);
      interactionRoot.removeEventListener("pointerleave", onPointerLeave);
      interactionRoot.removeEventListener("pointercancel", onPointerLeave);
    };
  }, [interactionRootClass]);

  return <canvas ref={canvasRef} className={className} aria-hidden />;
}
