import { TRNButton } from "../../../ui/TRN/TRNButton";
import { TRNHintText } from "../../../ui/TRN/TRNHintText";
import { TRNScrubNumberInput } from "../../../ui/TRN/TRNScrubNumberInput";
import { TRNSectionContainer } from "../../../ui/TRN/TRNSectionContainer";
import { TRNSettingRow } from "../../../ui/TRN/TRNSettingRow";
import {
  PROJECT4_SCANNER_AZIMUTH_DEG_MAX,
  PROJECT4_SCANNER_AZIMUTH_DEG_MIN,
} from "../../settings/project4-settings.normalize";
import { useProject4SettingsStore } from "../../settings/project4-settings.store";
import { PANEL_FORM_CONTROL_ROW_CLASS } from "../../../lib/panel-form-control-classes";

const sectionShellClass =
  "h-auto min-h-0 shrink-0 border-zinc-700 bg-zinc-950 shadow-none";

const inputClass = PANEL_FORM_CONTROL_ROW_CLASS;

/**
 * Visual-only calibration for the Three.js twin: how MCU-reported angles map to mesh yaw.
 * MCU sweep endpoints live under **Hardware setup** — this dialog only sets the on-model arc.
 */
export function Project4TwinViewerSetupPanel() {
  const s = useProject4SettingsStore();
  const { patchProject4Settings, resetProject4TwinViewerSetupToDefaults } = s;

  return (
    <div className="flex max-h-[min(72vh,680px)] min-h-0 flex-col font-sans antialiased text-zinc-100">
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <div className="flex flex-col gap-4">
          <TRNHintText tone="info" className="text-xs leading-relaxed">
            These fields affect the <span className="font-medium text-sky-100/90">3D viewer only</span> — they do{" "}
            <span className="font-medium text-sky-100/90">not</span> change your microcontroller or JSON telemetry.
            The loaded GLB pose is <span className="font-medium text-sky-100/90">0°</span>; values below are the{" "}
            <span className="font-mono text-sky-200/80">±</span> yaw sweep applied after remapping from{" "}
            <span className="font-mono text-sky-200/85">MCU sweep</span> (
            <span className="font-mono text-sky-200/85">
              {s.scannerTelemetrySweepMinDeg}–{s.scannerTelemetrySweepMaxDeg}°
            </span>
            ), configured under <span className="font-medium text-sky-100/90">Hardware setup</span>.
          </TRNHintText>

          <TRNSectionContainer title="Scanner bearing on model" className={sectionShellClass}>
            <div className="flex w-full min-w-0 flex-col gap-4">
              <div>
                <div className="mb-2 text-xs font-semibold text-zinc-200">
                  Front <span className="font-mono text-zinc-500">Ultrasonic_F</span>
                </div>
                <TRNHintText className="mb-2 text-[10px]">
                  Twin yaw offset bounds for <span className="font-mono text-zinc-400">aF</span> / legacy{" "}
                  <span className="font-mono text-zinc-400">a</span> (
                  {PROJECT4_SCANNER_AZIMUTH_DEG_MIN}…{PROJECT4_SCANNER_AZIMUTH_DEG_MAX}°).
                </TRNHintText>
                <div className="flex flex-col gap-3">
                  <TRNSettingRow label="Min yaw offset (deg)" hint="Typically negative (one lateral limit).">
                    <TRNScrubNumberInput
                      min={PROJECT4_SCANNER_AZIMUTH_DEG_MIN}
                      max={PROJECT4_SCANNER_AZIMUTH_DEG_MAX}
                      step={1}
                      fractionDigits={0}
                      value={s.scannerFrontAzimuthMinDeg}
                      onChange={(scannerFrontAzimuthMinDeg) =>
                        patchProject4Settings({ scannerFrontAzimuthMinDeg })
                      }
                      inputClassName={inputClass}
                      className="text-left"
                    />
                  </TRNSettingRow>
                  <TRNSettingRow label="Max yaw offset (deg)" hint="Must be greater than min (normalized on save).">
                    <TRNScrubNumberInput
                      min={PROJECT4_SCANNER_AZIMUTH_DEG_MIN}
                      max={PROJECT4_SCANNER_AZIMUTH_DEG_MAX}
                      step={1}
                      fractionDigits={0}
                      value={s.scannerFrontAzimuthMaxDeg}
                      onChange={(scannerFrontAzimuthMaxDeg) =>
                        patchProject4Settings({ scannerFrontAzimuthMaxDeg })
                      }
                      inputClassName={inputClass}
                      className="text-left"
                    />
                  </TRNSettingRow>
                </div>
              </div>
              <div className="border-t border-zinc-800 pt-3">
                <div className="mb-2 text-xs font-semibold text-zinc-200">
                  Rear <span className="font-mono text-zinc-500">Ultrasonic_R</span>
                </div>
                <TRNHintText className="mb-2 text-[10px]">
                  Twin yaw offset bounds for <span className="font-mono text-zinc-400">aR</span> / legacy{" "}
                  <span className="font-mono text-zinc-400">a</span>.
                </TRNHintText>
                <div className="flex flex-col gap-3">
                  <TRNSettingRow label="Min yaw offset (deg)">
                    <TRNScrubNumberInput
                      min={PROJECT4_SCANNER_AZIMUTH_DEG_MIN}
                      max={PROJECT4_SCANNER_AZIMUTH_DEG_MAX}
                      step={1}
                      fractionDigits={0}
                      value={s.scannerRearAzimuthMinDeg}
                      onChange={(scannerRearAzimuthMinDeg) =>
                        patchProject4Settings({ scannerRearAzimuthMinDeg })
                      }
                      inputClassName={inputClass}
                      className="text-left"
                    />
                  </TRNSettingRow>
                  <TRNSettingRow label="Max yaw offset (deg)" hint="Must be greater than min (normalized on save).">
                    <TRNScrubNumberInput
                      min={PROJECT4_SCANNER_AZIMUTH_DEG_MIN}
                      max={PROJECT4_SCANNER_AZIMUTH_DEG_MAX}
                      step={1}
                      fractionDigits={0}
                      value={s.scannerRearAzimuthMaxDeg}
                      onChange={(scannerRearAzimuthMaxDeg) =>
                        patchProject4Settings({ scannerRearAzimuthMaxDeg })
                      }
                      inputClassName={inputClass}
                      className="text-left"
                    />
                  </TRNSettingRow>
                </div>
              </div>
            </div>
          </TRNSectionContainer>
        </div>
      </div>
      <div className="shrink-0 border-t border-zinc-800 bg-zinc-950 px-3 py-2.5">
        <TRNButton
          type="button"
          size="compact"
          className="w-full border-zinc-600/80 text-xs font-medium text-zinc-200"
          onClick={() => resetProject4TwinViewerSetupToDefaults()}
        >
          Restore defaults
        </TRNButton>
        <TRNHintText tone="muted" className="mt-1.5 text-[9px] leading-snug text-zinc-500">
          Resets front/rear viewer yaw bounds only — does not change Hardware MCU sweep or Connection.
        </TRNHintText>
      </div>
    </div>
  );
}
