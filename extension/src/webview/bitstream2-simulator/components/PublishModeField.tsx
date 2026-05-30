import type { Bs2PublishMode } from "../../../bitstream2/domains/config/sensor-config";
import { TRNButton, TRNFormField } from "../../ui/TRN";
import { SENSOR_CFG_UI } from "../../bitstream-app/constants/sensorConfigUiLabels";

type Props = {
  publishMode: Bs2PublishMode;
  disabled?: boolean;
  dirty?: boolean;
  appliedMode: Bs2PublishMode;
  onChange: (mode: Bs2PublishMode) => void;
};

const MODES: { value: Bs2PublishMode; label: string }[] = [
  { value: 0, label: "Periodic" },
  { value: 1, label: "On change" },
  { value: 2, label: "Hybrid" },
];

export function PublishModeField({ publishMode, disabled, dirty, appliedMode, onChange }: Props) {
  const appliedLabel = MODES.find((m) => m.value === appliedMode)?.label ?? String(appliedMode);

  return (
    <TRNFormField label={SENSOR_CFG_UI.telemetryMode} className="sm:col-span-2">
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap gap-1">
          {MODES.map((m) => (
            <TRNButton
              key={m.value}
              size="compact"
              selected={publishMode === m.value}
              disabled={disabled}
              className="min-w-16 flex-1"
              onClick={() => onChange(m.value)}
            >
              {m.label}
            </TRNButton>
          ))}
        </div>
        {dirty ? (
          <p className="text-[10px] text-amber-200/70">Applied: {appliedLabel}</p>
        ) : null}
      </div>
    </TRNFormField>
  );
}
