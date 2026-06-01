import { flowSecondsToFrames, readFlowClockSnapshot } from "./flow-clock";

export function evaluateSceneTime(): { seconds: number; frames: number } {
  const { seconds } = readFlowClockSnapshot();
  return { seconds, frames: flowSecondsToFrames(seconds) };
}

export function evaluateFrameDelta(): { delta: number; fps: number } {
  const { deltaSec, fps } = readFlowClockSnapshot();
  return { delta: deltaSec, fps };
}
