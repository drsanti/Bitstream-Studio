import type { PresentationBmi270Frame } from "../display/selectors";
import { presentationBmi270FromSample } from "../display/selectors";

const EMPTY = presentationBmi270FromSample(null);

/** Mutable ref for R3F useFrame — avoids React re-render in 3D loop. */
export const presentationBmi270FrameRef: { current: PresentationBmi270Frame } = {
  current: EMPTY,
};
