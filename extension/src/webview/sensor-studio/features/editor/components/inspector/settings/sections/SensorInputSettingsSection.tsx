import { STUDIO_SENSOR_SOURCE_KEY_OPTIONS } from "../../../../../../core/live/resolve-sensor-source-key";
import { InspectorSelectRow } from "../../InspectorDenseControls";
import { InspectorPropertyRow } from "../../InspectorPropertyRow";
import { InspectorTextField } from "../../InspectorNumericScrubRow";
import { InspectorSettingsSectionFrame } from "../../InspectorSettingsSectionFrame";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";

export function SensorInputSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const {
    selectedNode,
    onUpdateConfigField,
    sourceKeyDraft,
    setSourceKeyDraft,
    sourceKeyFieldError,
    setSourceKeyFieldError,
  } = props;

  const sourceKey = String(selectedNode.data.defaultConfig.sourceKey ?? "bmi270.accel.x");

  return (
    <InspectorSettingsSectionFrame title="Hardware source">
      <InspectorSelectRow
        label="Preset"
        description="Pick a validated Bitstream path, or type a custom path below."
        ariaLabel="Sensor source preset"
        value={sourceKey}
        options={STUDIO_SENSOR_SOURCE_KEY_OPTIONS.map((option) => ({
          value: option.value,
          label: option.label,
        }))}
        onChange={(next) => {
          const ok = onUpdateConfigField("sourceKey", next);
          if (ok) {
            setSourceKeyDraft(next);
            setSourceKeyFieldError(null);
          }
        }}
      />
      <InspectorPropertyRow
        label="Custom sourceKey"
        description="Validated on blur against allowlisted hardware paths."
      >
        <>
          <InspectorTextField
            ariaLabel="Custom sensor source key"
            value={sourceKeyDraft}
            className={
              sourceKeyFieldError != null
                ? "font-mono text-red-100"
                : "font-mono"
            }
            onChange={setSourceKeyDraft}
            onBlur={() => {
              const trimmed = sourceKeyDraft.trim();
              if (trimmed.length === 0) {
                setSourceKeyFieldError(
                  "sourceKey cannot be empty — choose a path from the list.",
                );
                return;
              }
              const ok = onUpdateConfigField("sourceKey", trimmed);
              if (ok) {
                setSourceKeyFieldError(null);
                setSourceKeyDraft(trimmed);
              } else {
                setSourceKeyFieldError(
                  "Invalid sourceKey. Use a path from the dropdown or another allowlisted hardware path.",
                );
              }
            }}
          />
          {sourceKeyFieldError != null ? (
            <div className="mt-1 text-[10px] text-red-400">{sourceKeyFieldError}</div>
          ) : null}
        </>
      </InspectorPropertyRow>
      <p className="text-[10px] leading-snug text-zinc-500">
        Uses Bitstream samples when the transport is connected; otherwise numeric
        placeholders until data arrives.
      </p>
    </InspectorSettingsSectionFrame>
  );
}
