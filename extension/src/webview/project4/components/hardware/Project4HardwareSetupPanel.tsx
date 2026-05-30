import { TRNButton } from "../../../ui/TRN/TRNButton";
import { TRNHintText } from "../../../ui/TRN/TRNHintText";
import { TRNScrubNumberInput } from "../../../ui/TRN/TRNScrubNumberInput";
import { TRNSectionContainer } from "../../../ui/TRN/TRNSectionContainer";
import { TRNSettingRow } from "../../../ui/TRN/TRNSettingRow";
import {
  PROJECT4_SCANNER_TELEMETRY_SWEEP_DEG_MAX,
  PROJECT4_SCANNER_TELEMETRY_SWEEP_DEG_MIN,
} from "../../settings/project4-settings.normalize";
import { useProject4SettingsStore } from "../../settings/project4-settings.store";
import { PANEL_FORM_CONTROL_ROW_CLASS } from "../../../lib/panel-form-control-classes";

const sectionShellClass =
  "h-auto min-h-0 shrink-0 border-zinc-700 bg-zinc-950 shadow-none";

const inputClass = PANEL_FORM_CONTROL_ROW_CLASS;

/**
 * MCU- and robot-aligned fields: real dimensions, telemetry sweep as reported by firmware,
 * and firmware-linked HUD hints. On-model scanner swing limits live in **Digital twin setup**.
 * Persisted under `ternion.project4.settings.v1`.
 */
export function Project4HardwareSetupPanel() {
  const s = useProject4SettingsStore();
  const { patchProject4Settings, resetProject4HardwareSetupToDefaults } = s;

  return (
    <div className="flex max-h-[min(72vh,680px)] min-h-0 flex-col font-sans antialiased text-zinc-100">
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <div className="flex flex-col gap-4">
          <TRNHintText tone="info" className="text-xs leading-relaxed">
            Match these to your{" "}
            <span className="font-medium text-sky-100/90">physical robot</span> and{" "}
            <span className="font-medium text-sky-100/90">MCU / firmware</span> docs — what the hardware reports
            and how big the chassis is. For{" "}
            <span className="font-medium text-sky-100/90">how the GLB pivots on screen</span>, use{" "}
            <span className="font-medium text-sky-100/90">Digital twin setup</span> (toolbar icon next to this
            panel).
          </TRNHintText>

          <TRNSectionContainer title="Robot geometry" className={sectionShellClass}>
            <div className="flex w-full min-w-0 flex-col gap-3">
              <TRNSettingRow
                label="Track width (m)"
                hint="Left–right wheel spacing (see PROJECT_INFO / GLB)."
              >
                <TRNScrubNumberInput
                  min={0.01}
                  step={0.001}
                  fractionDigits={3}
                  value={s.trackWidthM}
                  onChange={(trackWidthM) => patchProject4Settings({ trackWidthM })}
                  inputClassName={inputClass}
                  className="text-left"
                />
              </TRNSettingRow>
              <TRNSettingRow label="Wheelbase (m)" hint="Front–rear axle spacing.">
                <TRNScrubNumberInput
                  min={0.01}
                  step={0.001}
                  fractionDigits={3}
                  value={s.wheelbaseM}
                  onChange={(wheelbaseM) => patchProject4Settings({ wheelbaseM })}
                  inputClassName={inputClass}
                  className="text-left"
                />
              </TRNSettingRow>
              <TRNSettingRow
                label="Wheel radius (m)"
                hint="Used for v→ω on twin wheels; calibrate vs measured tire."
              >
                <TRNScrubNumberInput
                  min={0.01}
                  step={0.001}
                  fractionDigits={3}
                  value={s.wheelRadiusM}
                  onChange={(wheelRadiusM) => patchProject4Settings({ wheelRadiusM })}
                  inputClassName={inputClass}
                  className="text-left"
                />
              </TRNSettingRow>
            </div>
          </TRNSectionContainer>

          <TRNSectionContainer title="MCU scanner telemetry & safety (HUD)" className={sectionShellClass}>
            <div className="flex w-full min-w-0 flex-col gap-3">
              <div className="flex flex-col gap-3 pb-1">
                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  MCU telemetry sweep (both scanners)
                </div>
                <TRNHintText className="text-[10px]">
                  Degrees your MCU sends across a <span className="text-zinc-300">full pan</span> (
                  <span className="font-mono text-zinc-400">aF</span>,{" "}
                  <span className="font-mono text-zinc-400">aR</span>, legacy{" "}
                  <span className="font-mono text-zinc-400">a</span>). Allowed input band{" "}
                  {PROJECT4_SCANNER_TELEMETRY_SWEEP_DEG_MIN}…{PROJECT4_SCANNER_TELEMETRY_SWEEP_DEG_MAX}° — defaults
                  match <span className="font-mono text-zinc-400">PROJECT_INFO</span> / firmware JSON spec{" "}
                  <span className="font-mono text-zinc-400">45–135°</span> for{" "}
                  <span className="font-mono text-zinc-400">a</span>; change only if your build differs.
                </TRNHintText>
                <TRNSettingRow
                  label="MCU sweep min (deg)"
                  hint="Invalid min≥max resets pair to defaults on save."
                >
                  <TRNScrubNumberInput
                    min={PROJECT4_SCANNER_TELEMETRY_SWEEP_DEG_MIN}
                    max={PROJECT4_SCANNER_TELEMETRY_SWEEP_DEG_MAX}
                    step={1}
                    fractionDigits={0}
                    value={s.scannerTelemetrySweepMinDeg}
                    onChange={(scannerTelemetrySweepMinDeg) =>
                      patchProject4Settings({ scannerTelemetrySweepMinDeg })
                    }
                    inputClassName={inputClass}
                    className="text-left"
                  />
                </TRNSettingRow>
                <TRNSettingRow label="MCU sweep max (deg)">
                  <TRNScrubNumberInput
                    min={PROJECT4_SCANNER_TELEMETRY_SWEEP_DEG_MIN}
                    max={PROJECT4_SCANNER_TELEMETRY_SWEEP_DEG_MAX}
                    step={1}
                    fractionDigits={0}
                    value={s.scannerTelemetrySweepMaxDeg}
                    onChange={(scannerTelemetrySweepMaxDeg) =>
                      patchProject4Settings({ scannerTelemetrySweepMaxDeg })
                    }
                    inputClassName={inputClass}
                    className="text-left"
                  />
                </TRNSettingRow>
              </div>
              <TRNSettingRow
                label="Reverse safety display (cm)"
                hint="Informational HUD parity with firmware rear stop distance."
              >
                <TRNScrubNumberInput
                  min={1}
                  step={1}
                  fractionDigits={0}
                  value={s.reverseSafetyStopCmDisplay}
                  onChange={(reverseSafetyStopCmDisplay) =>
                    patchProject4Settings({
                      reverseSafetyStopCmDisplay,
                    })
                  }
                  inputClassName={inputClass}
                  className="text-left"
                />
              </TRNSettingRow>
            </div>
          </TRNSectionContainer>
        </div>
      </div>
      <div className="shrink-0 border-t border-zinc-800 bg-zinc-950 px-3 py-2.5">
        <TRNButton
          type="button"
          size="compact"
          className="w-full border-zinc-600/80 text-xs font-medium text-zinc-200"
          onClick={() => resetProject4HardwareSetupToDefaults()}
        >
          Restore defaults
        </TRNButton>
        <TRNHintText tone="muted" className="mt-1.5 text-[9px] leading-snug text-zinc-500">
          Resets robot geometry, MCU sweep, and reverse safety display only — not Connection, Digital twin, or
          Advanced.
        </TRNHintText>
      </div>
    </div>
  );
}
