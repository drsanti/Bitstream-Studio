import { ReadingLabel } from "./ReadingLabel";
import { ReadingNumber } from "./ReadingNumber";
import { ReadingsGridAxisHeader } from "./ReadingsGridAxisHeader";
import {
  INSPECTOR_READINGS_GRID_4,
  INSPECTOR_READINGS_ROW_CLASS,
  INSPECTOR_READINGS_VALUE_CELL,
} from "./inspector-readings-grid";
import { readingParamAxisValueClass } from "./param-axis-classes";
import { SENSOR_TEMPERATURE_PORT_LABEL } from "../../../../../core/sensor-port-labels";

export type Bmm350AlignedReadingsProps = {
  magnetic: { x: number; y: number; z: number };
  temp: number | null | undefined;
};

/** BMM350 live panel for the Node Inspector Live tab. */
export function Bmm350AlignedReadings(props: Bmm350AlignedReadingsProps) {
  const { magnetic, temp } = props;

  return (
    <div className="min-w-0 w-full">
      <ReadingsGridAxisHeader
        gridTemplateColumns={INSPECTOR_READINGS_GRID_4}
        axes={["x", "y", "z"]}
      />
      <div
        className={INSPECTOR_READINGS_ROW_CLASS}
        style={{ gridTemplateColumns: INSPECTOR_READINGS_GRID_4 }}
      >
        <ReadingLabel className="min-w-0 self-center">Magnetic (µT)</ReadingLabel>
        <ReadingNumber
          value={magnetic.x}
          fractionDigits={2}
          className={`${INSPECTOR_READINGS_VALUE_CELL} ${readingParamAxisValueClass("x")}`}
        />
        <ReadingNumber
          value={magnetic.y}
          fractionDigits={2}
          className={`${INSPECTOR_READINGS_VALUE_CELL} ${readingParamAxisValueClass("y")}`}
        />
        <ReadingNumber
          value={magnetic.z}
          fractionDigits={2}
          className={`${INSPECTOR_READINGS_VALUE_CELL} ${readingParamAxisValueClass("z")}`}
        />
      </div>
      <div
        className={`${INSPECTOR_READINGS_ROW_CLASS} border-zinc-700/45 pt-2`}
        style={{ gridTemplateColumns: INSPECTOR_READINGS_GRID_4 }}
      >
        <ReadingLabel className="min-w-0 self-center">{SENSOR_TEMPERATURE_PORT_LABEL}</ReadingLabel>
        <ReadingNumber
          value={temp}
          fractionDigits={2}
          signedPositive={false}
          className={`col-span-3 ${INSPECTOR_READINGS_VALUE_CELL} text-zinc-100`}
        />
      </div>
    </div>
  );
}
