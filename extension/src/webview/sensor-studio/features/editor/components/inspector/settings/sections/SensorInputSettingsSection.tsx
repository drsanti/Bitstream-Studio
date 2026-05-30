import { STUDIO_SENSOR_SOURCE_KEY_OPTIONS } from "../../../../../../core/live/resolve-sensor-source-key";
import { InspectorPropertyRow } from "../../InspectorPropertyRow";
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

  return (
    <InspectorSettingsSectionFrame title="Hardware source">
      <InspectorPropertyRow
        label="Preset"
        description="Pick a validated Bitstream path, or type a custom path below."
      >
        <select
          className="w-full rounded border border-zinc-700/80 bg-zinc-900/60 px-2 py-1"
          value={String(
            selectedNode.data.defaultConfig.sourceKey ?? "bmi270.accel.x",
          )}
          onChange={(event) => {
            const next = event.target.value;
            const ok = onUpdateConfigField("sourceKey", next);
            if (ok) {
              setSourceKeyDraft(next);
              setSourceKeyFieldError(null);
            }
          }}
        >
          {STUDIO_SENSOR_SOURCE_KEY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </InspectorPropertyRow>
      <InspectorPropertyRow
        label="Custom sourceKey"
        description="Validated on blur against allowlisted hardware paths."
      >
        <>
          <input
            type="text"
            spellCheck={false}
            className={`w-full rounded border px-2 py-1 font-mono text-[11px] outline-none focus:border-cyan-400/60 ${
              sourceKeyFieldError != null
                ? "border-red-500/60 bg-red-950/25"
                : "border-zinc-700/80 bg-zinc-900/60"
            }`}
            value={sourceKeyDraft}
            onChange={(event) => setSourceKeyDraft(event.target.value)}
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
            <div className="mt-1 text-[10px] text-red-400">
              {sourceKeyFieldError}
            </div>
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
