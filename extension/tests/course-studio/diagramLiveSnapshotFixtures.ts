import { DIAGRAM_DESIGN_TIME_SNAPSHOT } from "../../src/webview/course-studio/runtime/diagram/diagramDesignTimeSnapshot";
import type { DiagramLiveSnapshot } from "../../src/webview/course-studio/runtime/diagram/diagramBindingCatalog";

type SensorPartial = {
  bmi270?: Partial<DiagramLiveSnapshot["bmi270"]>;
  bmm350?: Partial<DiagramLiveSnapshot["bmm350"]>;
  sht40?: Partial<DiagramLiveSnapshot["sht40"]>;
  dps368?: Partial<DiagramLiveSnapshot["dps368"]>;
  connected?: boolean;
};

/** Merge overrides onto the design-time empty snapshot for tests. */
export function diagramLiveSnapshot(overrides: SensorPartial = {}): DiagramLiveSnapshot {
  return {
    ...DIAGRAM_DESIGN_TIME_SNAPSHOT,
    connected: overrides.connected ?? DIAGRAM_DESIGN_TIME_SNAPSHOT.connected,
    bmi270: { ...DIAGRAM_DESIGN_TIME_SNAPSHOT.bmi270, ...overrides.bmi270 },
    bmm350: { ...DIAGRAM_DESIGN_TIME_SNAPSHOT.bmm350, ...overrides.bmm350 },
    sht40: { ...DIAGRAM_DESIGN_TIME_SNAPSHOT.sht40, ...overrides.sht40 },
    dps368: { ...DIAGRAM_DESIGN_TIME_SNAPSHOT.dps368, ...overrides.dps368 },
  };
}
