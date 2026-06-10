import type {
  PresentationBmi270Frame,
  PresentationBmm350Frame,
  PresentationDps368Frame,
  PresentationSht40Frame,
} from "../../../presentation/display/selectors";

export type DiagramBindingSensorId = "bmi270" | "bmm350" | "sht40" | "dps368" | "bridge";

export type DiagramLiveSnapshot = {
  bmi270: PresentationBmi270Frame;
  bmm350: PresentationBmm350Frame;
  sht40: PresentationSht40Frame;
  dps368: PresentationDps368Frame;
  connected: boolean;
};

export type DiagramBindingCatalogEntry = {
  id: string;
  label: string;
  unit?: string;
  sensor: DiagramBindingSensorId;
  category: string;
  group: string;
  valueKind: "number" | "boolean";
};

export type CourseBindingSensorTab = {
  id: DiagramBindingSensorId;
  label: string;
  subtitle: string;
};

export const COURSE_BINDING_SENSOR_TABS: readonly CourseBindingSensorTab[] = [
  { id: "bmi270", label: "BMI270", subtitle: "IMU · accel, gyro, fusion" },
  { id: "bmm350", label: "BMM350", subtitle: "Magnetometer" },
  { id: "sht40", label: "SHT40", subtitle: "Temp · humidity" },
  { id: "dps368", label: "DPS368", subtitle: "Pressure · altitude" },
  { id: "bridge", label: "Bridge", subtitle: "Transport" },
] as const;
