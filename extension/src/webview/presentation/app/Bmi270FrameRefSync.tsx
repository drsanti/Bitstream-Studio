import { useEffect } from "react";
import { usePresentationBmi270 } from "./usePresentationSensor";
import { presentationBmi270FrameRef } from "./presentationBmi270FrameRef";

/** Keeps presentationBmi270FrameRef in sync with the live store. */
export function Bmi270FrameRefSync() {
  const frame = usePresentationBmi270();

  useEffect(() => {
    presentationBmi270FrameRef.current = frame;
  }, [frame]);

  return null;
}
