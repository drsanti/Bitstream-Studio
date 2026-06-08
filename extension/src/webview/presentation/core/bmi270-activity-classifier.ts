export type Bmi270Activity =
  | "Flat"
  | "Tilted"
  | "Shake"
  | "Free Fall"
  | "Spinning"
  | "Walking"
  | "Unknown";

export type Bmi270ActivityConfig = {
  label: Bmi270Activity;
  icon: string;
  color: string;
  bg: string;
  desc: string;
};

export const BMI270_ACTIVITIES: Bmi270ActivityConfig[] = [
  { label: "Free Fall", icon: "↓", color: "var(--axis-x)", bg: "var(--axis-x-bg)", desc: "|a| < 0.2 g" },
  { label: "Shake", icon: "↯", color: "var(--accent-red)", bg: "var(--accent-red-bg)", desc: "|a| > 2.5 g" },
  { label: "Flat", icon: "▭", color: "var(--accent-cyan)", bg: "var(--accent-cyan-bg)", desc: "aZ > 0.85 g, |aX|,|aY| < 0.2 g" },
  { label: "Tilted", icon: "◩", color: "var(--accent-amber)", bg: "var(--accent-amber-bg)", desc: "|aX| or |aY| > 0.3 g" },
  { label: "Spinning", icon: "↺", color: "var(--accent-purple)", bg: "var(--accent-purple-bg)", desc: "|ω| > 200 °/s" },
  { label: "Walking", icon: "⊞", color: "var(--axis-y)", bg: "var(--axis-y-bg)", desc: "2–8 step cycles / 2 s window" },
];

const HISTORY_SIZE = 60;

function classifyInstant(ax: number, ay: number, az: number, gx: number, gy: number, gz: number): Bmi270Activity {
  const mag = Math.sqrt(ax ** 2 + ay ** 2 + az ** 2);
  const omegaMag = Math.sqrt(gx ** 2 + gy ** 2 + gz ** 2);

  if (mag < 0.2) {
    return "Free Fall";
  }
  if (mag > 2.5) {
    return "Shake";
  }
  if (omegaMag > 200) {
    return "Spinning";
  }
  if (Math.abs(az) > 0.85 && Math.abs(ax) < 0.2 && Math.abs(ay) < 0.2) {
    return "Flat";
  }
  if (Math.abs(ax) > 0.3 || Math.abs(ay) > 0.3) {
    return "Tilted";
  }
  return "Unknown";
}

function detectWalking(magHistory: number[]): boolean {
  if (magHistory.length < 20) {
    return false;
  }
  const filtered = magHistory.map((m) => m - 1.0);
  let crossings = 0;
  for (let i = 1; i < filtered.length; i++) {
    if (filtered[i - 1] < 0 && filtered[i] >= 0) {
      crossings++;
    }
  }
  return crossings >= 2 && crossings <= 8;
}

export function classifyBmi270Activity(
  ax: number,
  ay: number,
  az: number,
  gx: number,
  gy: number,
  gz: number,
  magHistory: number[],
): { activity: Bmi270Activity; confidence: number; magHistory: number[] } {
  const mag = Math.sqrt(ax ** 2 + ay ** 2 + az ** 2);
  const nextHistory = [...magHistory, mag].slice(-HISTORY_SIZE);

  const walking = detectWalking(nextHistory);
  const activity = walking ? "Walking" : classifyInstant(ax, ay, az, gx, gy, gz);
  const confidence = activity === "Unknown" ? 0.35 : 0.82;

  return { activity, confidence, magHistory: nextHistory };
}
