import { readValueNormalizerInput as readSimInput } from "./value-normalizer-operations";

export { readSimInput };

function hashSeed(seed: number, t: number): number {
  const x = Math.sin(seed * 12.9898 + t * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function evaluateSineWave(
  timeSec: number,
  amplitude: number,
  frequency: number,
  phase: number,
  offset: number,
): number {
  return offset + amplitude * Math.sin(timeSec * frequency * Math.PI * 2 + phase);
}

export function evaluateRampSim(
  timeSec: number,
  rate: number,
  min: number,
  max: number,
  wrap: boolean,
): number {
  let v = min + timeSec * rate;
  if (wrap && max > min) {
    v = min + (((v - min) % (max - min)) + (max - min)) % (max - min);
  } else {
    const lo = Math.min(min, max);
    const hi = Math.max(min, max);
    v = Math.min(hi, Math.max(lo, v));
  }
  return v;
}

export function evaluateStepSim(
  timeSec: number,
  interval: number,
  low: number,
  high: number,
): number {
  const step = Math.floor(timeSec / Math.max(0.01, interval));
  return step % 2 === 0 ? low : high;
}

export function evaluateNoiseSim(
  timeSec: number,
  seed: number,
  amplitude: number,
  offset: number,
  smooth: number,
): number {
  const smoothSec = Math.max(0.05, smooth);
  const t0 = Math.floor(timeSec / smoothSec) * smoothSec;
  const t1 = t0 + smoothSec;
  const a = hashSeed(seed, t0);
  const b = hashSeed(seed, t1);
  const mix = (timeSec - t0) / smoothSec;
  return offset + amplitude * (a + (b - a) * mix);
}
