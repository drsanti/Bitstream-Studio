/** Valid `AnalyserNode.fftSize` values — powers of two in [32, 32768]. */
export const ANALYSER_FFT_SIZE_OPTIONS = [
  { value: "32", label: "32" },
  { value: "64", label: "64" },
  { value: "128", label: "128" },
  { value: "256", label: "256" },
  { value: "512", label: "512" },
  { value: "1024", label: "1024" },
  { value: "2048", label: "2048" },
  { value: "4096", label: "4096" },
  { value: "8192", label: "8192" },
  { value: "16384", label: "16384" },
  { value: "32768", label: "32768" },
] as const;

/** Round to the nearest allowed analyser FFT size (power of two in [32, 32768]). */
export function clampAnalyserFftSize(v: number): number {
  const n = Math.round(v);
  const min = 32;
  const max = 32768;
  const clamped = Math.max(min, Math.min(max, Number.isFinite(n) ? n : 2048));
  let p = 1;
  while (p < clamped) {
    p *= 2;
  }
  const lower = p / 2;
  if (lower >= min && Math.abs(lower - clamped) < Math.abs(p - clamped)) {
    return lower;
  }
  return Math.max(min, Math.min(max, p));
}
