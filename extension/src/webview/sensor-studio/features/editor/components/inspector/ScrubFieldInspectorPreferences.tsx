import { useState } from "react";
import {
  TRNButton,
} from "../../../../../ui/TRN";
import { InspectorPropertyRow } from "./InspectorPropertyRow";
import { InspectorOptionalScrubNumberField } from "./InspectorOptionalScrubNumberField";
import {
  ensureInspectorScrubFieldSettings,
  INSPECTOR_SCRUB_SETTINGS_KEY,
  INSPECTOR_SCRUB_STORED_DEFAULTS,
} from "./inspector-scrub-field-presets";
import {
  saveTrnScrubNumberFieldSettings,
  type TrnScrubNumberFieldStoredSettingsV1,
} from "../../../../../ui/TRN/trnScrubNumberFieldStorage";

function readScrubFieldSettings(): TrnScrubNumberFieldStoredSettingsV1 {
  return ensureInspectorScrubFieldSettings();
}

function persistScrubFieldSettings(next: TrnScrubNumberFieldStoredSettingsV1): void {
  saveTrnScrubNumberFieldSettings(INSPECTOR_SCRUB_SETTINGS_KEY, next);
}

function OptionalDecimalInspectorControl(props: {
  label: string;
  description: string;
  value: number | undefined;
  onCommit: (next: number | null) => void;
}) {
  const { label, description, value, onCommit } = props;

  return (
    <InspectorPropertyRow label={label} description={description}>
      <InspectorOptionalScrubNumberField
        ariaLabel={label}
        value={value}
        step={0.01}
        onCommit={onCommit}
      />
    </InspectorPropertyRow>
  );
}

/** Flow-wide scrub field chrome — stored in localStorage, not per node. */
export function ScrubFieldInspectorPreferences(props: { showValueRules?: boolean }) {
  const { showValueRules = true } = props;
  const [settings, setSettings] = useState<TrnScrubNumberFieldStoredSettingsV1>(
    () => readScrubFieldSettings() ?? INSPECTOR_SCRUB_STORED_DEFAULTS,
  );

  const appearance = settings.appearance ?? {};
  const interaction = settings.interaction ?? {};
  const valueRules = settings.valueRules ?? {};

  const setNext = (next: TrnScrubNumberFieldStoredSettingsV1) => {
    setSettings(next);
    persistScrubFieldSettings(next);
  };

  type VisibilityKey =
    | "stepButtonsVisibility"
    | "lockIconVisibility"
    | "resetIconVisibility"
    | "clearIconVisibility";

  const visibilityButtons = (
    kind: VisibilityKey,
    value: "hidden" | "always" | "hover",
    onPick: (v: "hidden" | "always" | "hover") => void,
  ) => (
    <div className="flex w-full gap-1.5">
      {([
        { id: "hidden", label: "Hidden" },
        { id: "always", label: "Always" },
        { id: "hover", label: "On hover" },
      ] as const).map((o) => (
        <TRNButton
          key={`${kind}-${o.id}`}
          size="compact"
          selected={value === o.id}
          className="h-6 min-w-0 flex-1 px-2 text-xs font-medium"
          onClick={() => onPick(o.id)}
        >
          {o.label}
        </TRNButton>
      ))}
    </div>
  );

  return (
    <div className="space-y-2">
      <InspectorPropertyRow label="Variant" description="Minimal hides the step/lock affordances.">
        <div className="flex w-full gap-1.5">
          {(["minimal", "full"] as const).map((v) => (
            <TRNButton
              key={v}
              size="compact"
              selected={(appearance.variant ?? "full") === v}
              className="h-6 min-w-0 flex-1 px-2 text-xs font-medium"
              onClick={() =>
                setNext({
                  ...settings,
                  appearance: { ...appearance, variant: v },
                })
              }
            >
              {v === "minimal" ? "Minimal" : "Full"}
            </TRNButton>
          ))}
        </div>
      </InspectorPropertyRow>

      <InspectorPropertyRow label="Step buttons" description="Visibility of [‹][›] controls.">
        {visibilityButtons(
          "stepButtonsVisibility",
          (appearance.stepButtonsVisibility ?? "always") as "hidden" | "always" | "hover",
          (v) =>
            setNext({
              ...settings,
              appearance: { ...appearance, stepButtonsVisibility: v },
            }),
        )}
      </InspectorPropertyRow>

      <InspectorPropertyRow label="Lock icon" description="Visibility of the lock toggle.">
        {visibilityButtons(
          "lockIconVisibility",
          (appearance.lockIconVisibility ?? "always") as "hidden" | "always" | "hover",
          (v) =>
            setNext({
              ...settings,
              appearance: { ...appearance, lockIconVisibility: v },
            }),
        )}
      </InspectorPropertyRow>

      <InspectorPropertyRow
        label="Reset icon"
        description="Visibility of ↺ restore-to-default (when the field provides a default)."
      >
        {visibilityButtons(
          "resetIconVisibility",
          (appearance.resetIconVisibility ?? "hidden") as "hidden" | "always" | "hover",
          (v) =>
            setNext({
              ...settings,
              appearance: { ...appearance, resetIconVisibility: v },
            }),
        )}
      </InspectorPropertyRow>

      <InspectorPropertyRow
        label="Clear icon"
        description="Visibility of ✕ clear on optional scrub fields."
      >
        {visibilityButtons(
          "clearIconVisibility",
          (appearance.clearIconVisibility ?? "hidden") as "hidden" | "always" | "hover",
          (v) =>
            setNext({
              ...settings,
              appearance: { ...appearance, clearIconVisibility: v },
            }),
        )}
      </InspectorPropertyRow>

      {showValueRules ? (
        <>
          <OptionalDecimalInspectorControl
            label="Default min (UI)"
            description="Default min bound used when a scrub field is rendered without an explicit min."
            value={typeof valueRules.min === "number" ? valueRules.min : undefined}
            onCommit={(next) =>
              setNext({
                ...settings,
                valueRules: { ...valueRules, min: next ?? undefined },
              })
            }
          />
          <OptionalDecimalInspectorControl
            label="Default max (UI)"
            description="Default max bound used when a scrub field is rendered without an explicit max."
            value={typeof valueRules.max === "number" ? valueRules.max : undefined}
            onCommit={(next) =>
              setNext({
                ...settings,
                valueRules: { ...valueRules, max: next ?? undefined },
              })
            }
          />
        </>
      ) : null}

      <InspectorPropertyRow label="Pointer drag scrub" description="Enables click-drag scrubbing.">
        <div className="flex w-full gap-1.5">
          {([
            { id: "on", label: "On" },
            { id: "off", label: "Off" },
          ] as const).map((o) => (
            <TRNButton
              key={`pointer-scrub-${o.id}`}
              size="compact"
              selected={(interaction.pointerScrubEnabled === false ? "off" : "on") === o.id}
              className="h-6 min-w-0 flex-1 px-2 text-xs font-medium"
              onClick={() =>
                setNext({
                  ...settings,
                  interaction: { ...interaction, pointerScrubEnabled: o.id === "on" },
                })
              }
            >
              {o.label}
            </TRNButton>
          ))}
        </div>
      </InspectorPropertyRow>

      <InspectorPropertyRow label="Drag sensitivity" description="How fast value changes while scrubbing.">
        <div className="flex w-full gap-1.5">
          {(["slow", "normal", "fast", "custom"] as const).map((p) => (
            <TRNButton
              key={p}
              size="compact"
              selected={(interaction.dragSensitivityPreset ?? "normal") === p}
              className="h-6 min-w-0 flex-1 px-2 text-xs font-medium"
              onClick={() =>
                setNext({
                  ...settings,
                  interaction: { ...interaction, dragSensitivityPreset: p },
                })
              }
            >
              {p === "normal" ? "Normal" : p[0].toUpperCase() + p.slice(1)}
            </TRNButton>
          ))}
        </div>
      </InspectorPropertyRow>

      <InspectorPropertyRow label="Mouse wheel" description="Enable wheel changes over the field.">
        <div className="flex w-full gap-1.5">
          {([
            { id: "on", label: "On" },
            { id: "off", label: "Off" },
          ] as const).map((o) => (
            <TRNButton
              key={`wheel-${o.id}`}
              size="compact"
              selected={(interaction.wheelEnabled === false ? "off" : "on") === o.id}
              className="h-6 min-w-0 flex-1 px-2 text-xs font-medium"
              onClick={() =>
                setNext({
                  ...settings,
                  interaction: { ...interaction, wheelEnabled: o.id === "on" },
                })
              }
            >
              {o.label}
            </TRNButton>
          ))}
        </div>
      </InspectorPropertyRow>

      <InspectorPropertyRow label="Bounded wheel" description="When min/max exist, choose wheel step mode.">
        <div className="flex w-full gap-1.5">
          {([
            { id: "span-percent", label: "1% span" },
            { id: "step", label: "Step" },
          ] as const).map((o) => (
            <TRNButton
              key={o.id}
              size="compact"
              selected={(interaction.wheelBoundedMode ?? "span-percent") === o.id}
              className="h-6 min-w-0 flex-1 px-2 text-xs font-medium"
              onClick={() =>
                setNext({
                  ...settings,
                  interaction: { ...interaction, wheelBoundedMode: o.id },
                })
              }
            >
              {o.label}
            </TRNButton>
          ))}
        </div>
      </InspectorPropertyRow>
    </div>
  );
}
