import type { DiagramLiveSnapshot } from "./diagramBindingCatalog";
import { presentationBmi270FromSample } from "../../../presentation/display/selectors";

/** Neutral snapshot for maintainer canvas — bindings use fallbacks / zero offsets. */
export const DIAGRAM_DESIGN_TIME_SNAPSHOT: DiagramLiveSnapshot = {
  bmi270: presentationBmi270FromSample(null),
  connected: false,
};
