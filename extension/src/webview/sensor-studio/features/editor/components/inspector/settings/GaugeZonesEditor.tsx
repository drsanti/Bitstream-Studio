import { Plus, Trash2 } from "lucide-react";
import { useCallback, useMemo } from "react";
import { TRNButton, TRNHintText } from "../../../../../../ui/TRN";
import {
  InspectorFieldGrid,
  InspectorFieldGridControls,
  InspectorFieldGridLabels,
} from "../InspectorFieldGrid";
import { InspectorColorRow, InspectorSelectRow } from "../InspectorDenseControls";
import { InspectorNumericField } from "../InspectorNumericScrubRow";
import {
  GAUGE_ZONE_PRESET_OPTIONS,
  type GaugeDisplayZone,
  type GaugeZonePresetId,
  gaugeZonesFromPreset,
  matchGaugeZonePreset,
  normalizeGaugeHexColor,
} from "../../../nodes/display/gauge-display-config";

export type GaugeZonesEditorProps = {
  zones: GaugeDisplayZone[];
  min: number;
  max: number;
  onChange: (next: GaugeDisplayZone[]) => void;
};

const GAUGE_ZONE_CUSTOM_PRESET_VALUE = "custom" as const;

export function GaugeZonesEditor(props: GaugeZonesEditorProps) {
  const { zones, min, max, onChange } = props;

  const selectedPreset = useMemo(
    () => matchGaugeZonePreset(zones, min, max),
    [zones, min, max],
  );

  const patchZone = useCallback(
    (index: number, patch: Partial<GaugeDisplayZone>) => {
      onChange(
        zones.map((zone, i) => (i === index ? { ...zone, ...patch } : zone)),
      );
    },
    [onChange, zones],
  );

  const removeZone = useCallback(
    (index: number) => {
      onChange(zones.filter((_, i) => i !== index));
    },
    [onChange, zones],
  );

  const addZone = useCallback(() => {
    const lo = Math.min(min, max);
    const hi = Math.max(min, max);
    const mid = lo + (hi - lo) * 0.5;
    onChange([
      ...zones,
      {
        from: mid,
        to: hi,
        color: "#22d3ee",
      },
    ]);
  }, [max, min, onChange, zones]);

  const applyPreset = useCallback(
    (presetId: GaugeZonePresetId) => {
      onChange(gaugeZonesFromPreset(presetId, min, max));
    },
    [max, min, onChange],
  );

  const presetOptions = useMemo(
    () => [
      ...GAUGE_ZONE_PRESET_OPTIONS.map((preset) => ({
        value: preset.id,
        label: preset.label,
      })),
      {
        value: GAUGE_ZONE_CUSTOM_PRESET_VALUE,
        label: "Custom",
        disabled: true,
      },
    ],
    [],
  );

  return (
    <div className="space-y-2">
      <InspectorSelectRow
        label="Preset"
        description="Replace all zones with a template mapped to the current min/max scale."
        ariaLabel="Gauge zone preset"
        value={selectedPreset}
        options={presetOptions}
        onChange={(next) => {
          if (
            next.length > 0 &&
            next !== GAUGE_ZONE_CUSTOM_PRESET_VALUE &&
            GAUGE_ZONE_PRESET_OPTIONS.some((preset) => preset.id === next)
          ) {
            applyPreset(next as GaugeZonePresetId);
          }
        }}
      />

      {zones.length === 0 ? (
        <TRNHintText>No zones — needle and readout use default accent colors.</TRNHintText>
      ) : null}

      <div className="space-y-2">
        {zones.map((zone, index) => (
          <div
            key={`zone-${index}-${zone.from}-${zone.to}`}
            className="space-y-1.5 rounded border border-zinc-800/80 bg-black/25 p-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                Zone {index + 1}
              </span>
              <TRNButton
                type="button"
                size="compact"
                className="h-6 min-w-0 px-1.5 text-rose-300/90"
                hint="Remove this zone"
                aria-label={`Remove zone ${index + 1}`}
                onClick={() => {
                  removeZone(index);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
              </TRNButton>
            </div>
            <InspectorFieldGrid>
              <InspectorFieldGridLabels
                left={{ label: "From" }}
                right={{ label: "To" }}
              />
              <InspectorFieldGridControls
                left={
                  <InspectorNumericField
                    ariaLabel={`Zone ${index + 1} from value`}
                    value={zone.from}
                    step={0.01}
                    onCommit={(next) => {
                      patchZone(index, { from: next });
                    }}
                  />
                }
                right={
                  <InspectorNumericField
                    ariaLabel={`Zone ${index + 1} to value`}
                    value={zone.to}
                    step={0.01}
                    onCommit={(next) => {
                      patchZone(index, { to: next });
                    }}
                  />
                }
              />
            </InspectorFieldGrid>
            <InspectorColorRow
              label="Color"
              ariaLabel={`Zone ${index + 1} color`}
              value={normalizeGaugeHexColor(zone.color, "#22d3ee")}
              onChange={(next) => {
                patchZone(index, { color: next });
              }}
            />
          </div>
        ))}
      </div>

      <TRNButton
        type="button"
        size="compact"
        className="w-full"
        hint="Append a new band; edit from/to to match your scale."
        onClick={addZone}
      >
        <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden />
        Add zone
      </TRNButton>
    </div>
  );
}
