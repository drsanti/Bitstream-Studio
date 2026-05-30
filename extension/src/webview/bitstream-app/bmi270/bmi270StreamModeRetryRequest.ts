/** UI-requested resync of `sensor.bmi270.mode.set` (clears sent-ref gate in sync effect). */
let bmi270StreamModeRetryRequested = false;

export function requestBmi270StreamModeRetry(): void {
  bmi270StreamModeRetryRequested = true;
}

export function consumeBmi270StreamModeRetry(): boolean {
  if (!bmi270StreamModeRetryRequested) {
    return false;
  }
  bmi270StreamModeRetryRequested = false;
  return true;
}
