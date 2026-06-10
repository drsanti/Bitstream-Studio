import type { DiagramBindingCatalogEntry } from "./diagramBindingCatalog.types";

/** All bindable telemetry paths for Course Studio / diagram live bindings. */
export const DIAGRAM_BINDING_CATALOG: readonly DiagramBindingCatalogEntry[] = [
  // BMI270 — IMU
  { id: "bmi270.ax", label: "Accelerometer X", unit: "g", sensor: "bmi270", category: "Accel", group: "BMI270 · Accel", valueKind: "number" },
  { id: "bmi270.axAbs", label: "Accelerometer |X|", unit: "g", sensor: "bmi270", category: "Accel", group: "BMI270 · Accel", valueKind: "number" },
  { id: "bmi270.ay", label: "Accelerometer Y", unit: "g", sensor: "bmi270", category: "Accel", group: "BMI270 · Accel", valueKind: "number" },
  { id: "bmi270.ayAbs", label: "Accelerometer |Y|", unit: "g", sensor: "bmi270", category: "Accel", group: "BMI270 · Accel", valueKind: "number" },
  { id: "bmi270.az", label: "Accelerometer Z", unit: "g", sensor: "bmi270", category: "Accel", group: "BMI270 · Accel", valueKind: "number" },
  { id: "bmi270.azAbs", label: "Accelerometer |Z|", unit: "g", sensor: "bmi270", category: "Accel", group: "BMI270 · Accel", valueKind: "number" },
  { id: "bmi270.accMag", label: "Accelerometer |a|", unit: "g", sensor: "bmi270", category: "Accel", group: "BMI270 · Accel", valueKind: "number" },
  { id: "bmi270.gx", label: "Gyro X", unit: "°/s", sensor: "bmi270", category: "Gyro", group: "BMI270 · Gyro", valueKind: "number" },
  { id: "bmi270.gy", label: "Gyro Y", unit: "°/s", sensor: "bmi270", category: "Gyro", group: "BMI270 · Gyro", valueKind: "number" },
  { id: "bmi270.gz", label: "Gyro Z", unit: "°/s", sensor: "bmi270", category: "Gyro", group: "BMI270 · Gyro", valueKind: "number" },
  { id: "bmi270.gyrMag", label: "Gyro |ω|", unit: "°/s", sensor: "bmi270", category: "Gyro", group: "BMI270 · Gyro", valueKind: "number" },
  { id: "bmi270.heading", label: "Heading", unit: "°", sensor: "bmi270", category: "Fusion", group: "BMI270 · Fusion", valueKind: "number" },
  { id: "bmi270.pitch", label: "Pitch", unit: "°", sensor: "bmi270", category: "Fusion", group: "BMI270 · Fusion", valueKind: "number" },
  { id: "bmi270.roll", label: "Roll", unit: "°", sensor: "bmi270", category: "Fusion", group: "BMI270 · Fusion", valueKind: "number" },
  { id: "bmi270.qw", label: "Quaternion W", sensor: "bmi270", category: "Fusion", group: "BMI270 · Fusion", valueKind: "number" },
  { id: "bmi270.qx", label: "Quaternion X", sensor: "bmi270", category: "Fusion", group: "BMI270 · Fusion", valueKind: "number" },
  { id: "bmi270.qy", label: "Quaternion Y", sensor: "bmi270", category: "Fusion", group: "BMI270 · Fusion", valueKind: "number" },
  { id: "bmi270.qz", label: "Quaternion Z", sensor: "bmi270", category: "Fusion", group: "BMI270 · Fusion", valueKind: "number" },
  { id: "bmi270.temp", label: "Temperature", unit: "°C", sensor: "bmi270", category: "Temperature", group: "BMI270 · Temperature", valueKind: "number" },
  { id: "bmi270.accValid", label: "Accel valid", sensor: "bmi270", category: "Status", group: "BMI270 · Status", valueKind: "boolean" },
  { id: "bmi270.gyrValid", label: "Gyro valid", sensor: "bmi270", category: "Status", group: "BMI270 · Status", valueKind: "boolean" },
  { id: "bmi270.eulerValid", label: "Euler valid", sensor: "bmi270", category: "Status", group: "BMI270 · Status", valueKind: "boolean" },
  { id: "bmi270.quatValid", label: "Quaternion valid", sensor: "bmi270", category: "Status", group: "BMI270 · Status", valueKind: "boolean" },
  { id: "bmi270.hasSample", label: "Has sample", sensor: "bmi270", category: "Status", group: "BMI270 · Status", valueKind: "boolean" },

  // BMM350 — magnetometer
  { id: "bmm350.bx", label: "Magnetic X", unit: "µT", sensor: "bmm350", category: "Magnetic field", group: "BMM350 · Magnetic field", valueKind: "number" },
  { id: "bmm350.by", label: "Magnetic Y", unit: "µT", sensor: "bmm350", category: "Magnetic field", group: "BMM350 · Magnetic field", valueKind: "number" },
  { id: "bmm350.bz", label: "Magnetic Z", unit: "µT", sensor: "bmm350", category: "Magnetic field", group: "BMM350 · Magnetic field", valueKind: "number" },
  { id: "bmm350.magnitude", label: "Field |B|", unit: "µT", sensor: "bmm350", category: "Magnetic field", group: "BMM350 · Magnetic field", valueKind: "number" },
  { id: "bmm350.headingDeg", label: "Level heading", unit: "°", sensor: "bmm350", category: "Magnetic field", group: "BMM350 · Magnetic field", valueKind: "number" },
  { id: "bmm350.temp", label: "Temperature", unit: "°C", sensor: "bmm350", category: "Temperature", group: "BMM350 · Temperature", valueKind: "number" },
  { id: "bmm350.magValid", label: "Mag valid", sensor: "bmm350", category: "Status", group: "BMM350 · Status", valueKind: "boolean" },
  { id: "bmm350.tempValid", label: "Temp valid", sensor: "bmm350", category: "Status", group: "BMM350 · Status", valueKind: "boolean" },
  { id: "bmm350.hasSample", label: "Has sample", sensor: "bmm350", category: "Status", group: "BMM350 · Status", valueKind: "boolean" },

  // SHT40 — humidity
  { id: "sht40.temp", label: "Temperature", unit: "°C", sensor: "sht40", category: "Environment", group: "SHT40 · Environment", valueKind: "number" },
  { id: "sht40.rh", label: "Relative humidity", unit: "%RH", sensor: "sht40", category: "Environment", group: "SHT40 · Environment", valueKind: "number" },
  { id: "sht40.tempValid", label: "Temp valid", sensor: "sht40", category: "Status", group: "SHT40 · Status", valueKind: "boolean" },
  { id: "sht40.rhValid", label: "Humidity valid", sensor: "sht40", category: "Status", group: "SHT40 · Status", valueKind: "boolean" },
  { id: "sht40.hasSample", label: "Has sample", sensor: "sht40", category: "Status", group: "SHT40 · Status", valueKind: "boolean" },

  // DPS368 — barometer
  { id: "dps368.pressureHpa", label: "Pressure", unit: "hPa", sensor: "dps368", category: "Barometer", group: "DPS368 · Barometer", valueKind: "number" },
  { id: "dps368.temp", label: "Temperature", unit: "°C", sensor: "dps368", category: "Barometer", group: "DPS368 · Barometer", valueKind: "number" },
  { id: "dps368.altitudeM", label: "Altitude (derived)", unit: "m", sensor: "dps368", category: "Barometer", group: "DPS368 · Barometer", valueKind: "number" },
  { id: "dps368.pressureValid", label: "Pressure valid", sensor: "dps368", category: "Status", group: "DPS368 · Status", valueKind: "boolean" },
  { id: "dps368.tempValid", label: "Temp valid", sensor: "dps368", category: "Status", group: "DPS368 · Status", valueKind: "boolean" },
  { id: "dps368.hasSample", label: "Has sample", sensor: "dps368", category: "Status", group: "DPS368 · Status", valueKind: "boolean" },

  // Bridge
  { id: "bridge.connected", label: "Bridge connected", sensor: "bridge", category: "Transport", group: "Bridge", valueKind: "boolean" },
] as const;
