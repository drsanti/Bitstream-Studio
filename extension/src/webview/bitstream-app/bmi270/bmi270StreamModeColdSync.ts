import type { Bmi270StreamModeUi } from "../state/bitstreamConfig.store.js";

/** Maps firmware stream mode code (`modeEcho` from BMI270 mode ACK) to dashboard UI mode. */
export function bmi270ModeEchoToUi(modeEcho: number): Bmi270StreamModeUi {
  if (modeEcho === 0) return "raw";
  if (modeEcho === 1) return "fusion";
  return "hybrid";
}

let pendingColdSyncedUiMode: Bmi270StreamModeUi | null = null;

/** After transport-ready firmware read, suppress one redundant `sensor.bmi270.mode.set`. */
export function markBmi270StreamModeColdSynced(mode: Bmi270StreamModeUi): void {
  pendingColdSyncedUiMode = mode;
}

export function consumeBmi270StreamModeColdSynced(): Bmi270StreamModeUi | null {
  const v = pendingColdSyncedUiMode;
  pendingColdSyncedUiMode = null;
  return v;
}
