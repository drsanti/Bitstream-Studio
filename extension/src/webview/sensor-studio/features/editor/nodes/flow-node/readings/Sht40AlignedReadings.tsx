import { ReadingLabel } from "./ReadingLabel";
import { ReadingNumber } from "./ReadingNumber";
import {
  INSPECTOR_READINGS_GRID_4,
  INSPECTOR_READINGS_ROW_CLASS,
  INSPECTOR_READINGS_VALUE_CELL,
} from "./inspector-readings-grid";

export type Sht40AlignedReadingsProps = {
  humidity: number | null | undefined;
  temp: number | null | undefined;
};

/** SHT40 live panel for the Node Inspector Live tab. */
export function Sht40AlignedReadings(props: Sht40AlignedReadingsProps) {
  const { humidity, temp } = props;

  return (
    <div className="min-w-0 w-full">
      <ScalarReadingRow label="Humidity (%RH)" value={humidity} fractionDigits={2} />
      <ScalarReadingRow label="Temp (°C)" value={temp} fractionDigits={2} />
    </div>
  );
}

function ScalarReadingRow(props: {
  label: string;
  value: number | null | undefined;
  fractionDigits: number;
}) {
  const { label, value, fractionDigits } = props;
  return (
    <div
      className={INSPECTOR_READINGS_ROW_CLASS}
      style={{ gridTemplateColumns: INSPECTOR_READINGS_GRID_4 }}
    >
      <ReadingLabel className="min-w-0 self-center">{label}</ReadingLabel>
      <ReadingNumber
        value={value}
        fractionDigits={fractionDigits}
        signedPositive={false}
        className={`col-span-3 ${INSPECTOR_READINGS_VALUE_CELL} text-zinc-100`}
      />
    </div>
  );
}
