import type { DiagramLiveSnapshot } from "./diagramBindingCatalog";
import {
  presentationBmi270FromSample,
  presentationBmm350FromSample,
  presentationDps368FromSample,
  presentationSht40FromSample,
} from "../../../presentation/display/selectors";

/** Neutral snapshot for maintainer canvas — bindings use fallbacks / zero offsets. */
export const DIAGRAM_DESIGN_TIME_SNAPSHOT: DiagramLiveSnapshot = {
  bmi270: presentationBmi270FromSample(null),
  bmm350: presentationBmm350FromSample(null),
  sht40: presentationSht40FromSample(null),
  dps368: presentationDps368FromSample(null),
  connected: false,
};
