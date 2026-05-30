import { useMemo } from "react";
import { AnthropicApiKeySettingsPanel } from "../../ai-bridge/AnthropicApiKeySettingsPanel";
import {
  TRNAccordion,
  TRNAccordionContent,
  TRNAccordionItem,
  TRNAccordionTrigger,
} from "../../ui/TRN/TRNAccordion";
import { TRNButton } from "../../ui/TRN/TRNButton";
import { TRNHintText } from "../../ui/TRN/TRNHintText";
import { TRNInlineToggleRow } from "../../ui/TRN/TRNInlineToggleRow";
import { TRNSectionContainer } from "../../ui/TRN/TRNSectionContainer";
import { TRNSettingRow } from "../../ui/TRN/TRNSettingRow";
import { TRNScrubNumberInput } from "../../ui/TRN/TRNScrubNumberInput";
import { Project4ConnectionPresetCards } from "./settings/Project4ConnectionPresetCards";
import {
  composeMcuConnection,
  parseMcuConnection,
  type ParsedMcuConnection,
} from "../lib/mcu-connection-url";
import { useProject4SettingsStore } from "../settings/project4-settings.store";
import {
  PANEL_FORM_CONTROL_COMPACT_CLASS,
  PANEL_FORM_CONTROL_ROW_CLASS,
} from "../../lib/panel-form-control-classes";
import { twMerge } from "tailwind-merge";

const sectionShellClass =
  "h-auto min-h-0 shrink-0 border-zinc-700 bg-zinc-950 shadow-none";

const PROJECT4_MANUAL_MCU_ANCHOR_ID = "project4-mcu-manual-connection";

const inputClass = PANEL_FORM_CONTROL_ROW_CLASS;

export function Project4SettingsPanel() {
  const s = useProject4SettingsStore();
  const { patchProject4Settings, resetProject4Settings } = s;

  const mcuConn = useMemo(() => parseMcuConnection(s.mcuBaseUrl), [s.mcuBaseUrl]);

  const patchMcuConnection = (partial: Partial<ParsedMcuConnection>) => {
    const next = { ...mcuConn, ...partial };
    patchProject4Settings({ mcuBaseUrl: composeMcuConnection(next) });
  };

  return (
    <div className="flex max-h-[min(72vh,720px)] flex-col gap-4 overflow-y-auto px-3 py-3 text-zinc-100">
      <div className="rounded-xl border border-zinc-700/80 bg-zinc-950/75 p-3 backdrop-blur-sm">
        <TRNHintText tone="info" className="text-xs leading-relaxed">
          <span className="font-semibold text-sky-100/95">Robot geometry</span>,{" "}
          <span className="font-semibold text-sky-100/95">scanner limits</span>, and{" "}
          <span className="font-semibold text-sky-100/95">safety HUD hints</span> live in{" "}
          <span className="font-medium text-sky-50/95">Hardware setup</span> (wrench icon next to Settings).
        </TRNHintText>
      </div>
      <TRNSectionContainer title="Connection" className={sectionShellClass}>
        <div className="flex flex-col gap-3">
          <Project4ConnectionPresetCards
            mcuConnectionPreset={s.mcuConnectionPreset}
            mcuBaseUrl={s.mcuBaseUrl}
            onApplyPresetUrl={(url) => patchProject4Settings({ mcuBaseUrl: url })}
            onScrollToManual={() => {
              const el = document.getElementById(PROJECT4_MANUAL_MCU_ANCHOR_ID);
              el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
              const focusable = el?.querySelector<HTMLElement>(
                "input, select, textarea, button",
              );
              focusable?.focus({ preventScroll: true });
            }}
          />
          <div id={PROJECT4_MANUAL_MCU_ANCHOR_ID} className="scroll-mt-2">
          <TRNSettingRow
            label="MCU HTTP (manual)"
            hint="Pick a card above for mock vs real hardware, or edit here for custom hosts and ports. Values compose into the persisted base URL (no path — paths stay in the fields below). Empty port uses default 80 (http) or 443 (https)."
          >
            <div className="mt-1 flex flex-col gap-2">
              <div className="flex min-w-0 flex-nowrap items-end gap-2">
                <label className="flex w-21 shrink-0 flex-col gap-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  Scheme
                  <select
                    className={twMerge(PANEL_FORM_CONTROL_COMPACT_CLASS, "w-full")}
                    value={mcuConn.scheme}
                    onChange={(e) =>
                      patchMcuConnection({
                        scheme: e.target.value === "https" ? "https" : "http",
                      })
                    }
                  >
                    <option value="http">http</option>
                    <option value="https">https</option>
                  </select>
                </label>
                <label className="flex min-w-0 flex-1 flex-col gap-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  Host / IP
                  <input
                    type="text"
                    autoComplete="off"
                    spellCheck={false}
                    className={twMerge(PANEL_FORM_CONTROL_COMPACT_CLASS, "mt-0 min-w-0")}
                    placeholder="192.168.4.1"
                    value={mcuConn.host}
                    onChange={(e) => patchMcuConnection({ host: e.target.value })}
                  />
                </label>
                <label className="flex w-22 shrink-0 flex-col gap-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  Port (optional)
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    spellCheck={false}
                    className={twMerge(PANEL_FORM_CONTROL_COMPACT_CLASS, "mt-0")}
                    placeholder="8787"
                    value={mcuConn.port}
                    onChange={(e) =>
                      patchMcuConnection({
                        port: e.target.value.replace(/\D/g, "").slice(0, 5),
                      })
                    }
                  />
                </label>
              </div>
              <p className="text-[10px] font-semibold leading-snug tracking-wide text-zinc-500 break-all">
                Resolved base URL <span className="text-zinc-400">{s.mcuBaseUrl}</span>
              </p>
            </div>
          </TRNSettingRow>
          </div>
          <TRNSettingRow label="Telemetry path" hint="Default GET JSON endpoint for live state.">
            <input
              type="text"
              spellCheck={false}
              className={inputClass}
              value={s.telemetryPath}
              onChange={(e) => patchProject4Settings({ telemetryPath: e.target.value })}
            />
          </TRNSettingRow>
          <TRNSettingRow label="Move path">
            <input
              type="text"
              spellCheck={false}
              className={inputClass}
              value={s.movePath}
              onChange={(e) => patchProject4Settings({ movePath: e.target.value })}
            />
          </TRNSettingRow>
          <TRNSettingRow label="Set speed path">
            <input
              type="text"
              spellCheck={false}
              className={inputClass}
              value={s.setSpeedPath}
              onChange={(e) => patchProject4Settings({ setSpeedPath: e.target.value })}
            />
          </TRNSettingRow>
          <div className="grid grid-cols-2 gap-3">
            <TRNSettingRow label="Poll interval (ms)">
              <TRNScrubNumberInput
                min={50}
                max={5000}
                step={10}
                fractionDigits={0}
                value={s.telemetryPollIntervalMs}
                onChange={(telemetryPollIntervalMs) =>
                  patchProject4Settings({ telemetryPollIntervalMs })
                }
                inputClassName={inputClass}
                className="text-left"
              />
            </TRNSettingRow>
            <TRNSettingRow label="HTTP timeout (ms)">
              <TRNScrubNumberInput
                min={500}
                max={60000}
                step={100}
                fractionDigits={0}
                value={s.httpRequestTimeoutMs}
                onChange={(httpRequestTimeoutMs) =>
                  patchProject4Settings({ httpRequestTimeoutMs })
                }
                inputClassName={inputClass}
                className="text-left"
              />
            </TRNSettingRow>
          </div>
        </div>
      </TRNSectionContainer>

      <TRNSectionContainer title="Assistant (Claude)" className={sectionShellClass}>
        <AnthropicApiKeySettingsPanel />
      </TRNSectionContainer>

      <TRNSectionContainer title="Advanced" className={sectionShellClass}>
        <TRNAccordion
          type="single"
          collapsible
          className="border-0 bg-zinc-950/80"
        >
          <TRNAccordionItem value="adv">
            <TRNAccordionTrigger className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Query keys and setSpeed encoding
            </TRNAccordionTrigger>
            <TRNAccordionContent className="px-2 pb-3">
              <div className="flex flex-col gap-3">
                <TRNSettingRow label={`Move query key (default dir)`}>
                  <input
                    type="text"
                    spellCheck={false}
                    className={inputClass}
                    value={s.moveDirQueryKey}
                    onChange={(e) =>
                      patchProject4Settings({ moveDirQueryKey: e.target.value })
                    }
                  />
                </TRNSettingRow>
                <TRNSettingRow label={`SetSpeed value key (default val)`}>
                  <input
                    type="text"
                    spellCheck={false}
                    className={inputClass}
                    value={s.setSpeedValueQueryKey}
                    onChange={(e) =>
                      patchProject4Settings({ setSpeedValueQueryKey: e.target.value })
                    }
                  />
                </TRNSettingRow>
                <TRNInlineToggleRow
                  label="Append setSpeed value as query parameter"
                  hint="When on, the speed preset is sent as a GET query key (see SetSpeed value key above)."
                  checked={s.setSpeedUseQuery}
                  onCheckedChange={(setSpeedUseQuery) =>
                    patchProject4Settings({ setSpeedUseQuery })
                  }
                  ariaLabel="Append setSpeed value as GET query parameter"
                />
                <TRNSettingRow label="Robot model URL" hint="Used by the 3D twin milestone (M2).">
                  <input
                    type="text"
                    spellCheck={false}
                    className={inputClass}
                    value={s.robotModelUrl}
                    onChange={(e) => patchProject4Settings({ robotModelUrl: e.target.value })}
                  />
                </TRNSettingRow>
              </div>
            </TRNAccordionContent>
          </TRNAccordionItem>
        </TRNAccordion>
      </TRNSectionContainer>

      <div className="flex flex-wrap gap-2 border-t border-zinc-800 pt-3">
        <TRNButton
          type="button"
          size="compact"
          className="border-zinc-600/80 bg-zinc-950/60 hover:bg-zinc-900/75"
          onClick={() => resetProject4Settings()}
        >
          Reset all to defaults
        </TRNButton>
      </div>
    </div>
  );
}
