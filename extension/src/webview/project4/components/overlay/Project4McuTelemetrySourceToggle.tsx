import { Cpu, Link2, Server } from "lucide-react";
import { useCallback, useMemo } from "react";
import { twMerge } from "tailwind-merge";
import {
  MCU_CONNECTION_PRESET_MOCK,
  MCU_CONNECTION_PRESET_REAL,
  mcuBaseUrlFromPreset,
} from "../../lib/mcu-connection-presets";
import { useProject4SettingsStore } from "../../settings/project4-settings.store";
import { TRNIconButton } from "../../../ui/TRN/TRNIconButton";

/**
 * Toolbar control — flip **`mcuBaseUrl`** between the built-in mock server preset and the default real MCU preset.
 * Custom URLs snap back to mock on first click (same preset URLs as Connection cards).
 */
export function Project4McuTelemetrySourceToggle() {
  const mcuConnectionPreset = useProject4SettingsStore((s) => s.mcuConnectionPreset);
  const patchProject4Settings = useProject4SettingsStore((s) => s.patchProject4Settings);

  const mockUrl = useMemo(() => mcuBaseUrlFromPreset(MCU_CONNECTION_PRESET_MOCK), []);
  const realUrl = useMemo(() => mcuBaseUrlFromPreset(MCU_CONNECTION_PRESET_REAL), []);

  const onToggle = useCallback(() => {
    const nextUrl = mcuConnectionPreset === "mock" ? realUrl : mockUrl;
    patchProject4Settings({ mcuBaseUrl: nextUrl });
  }, [mcuConnectionPreset, mockUrl, realUrl, patchProject4Settings]);

  const title =
    mcuConnectionPreset === "mock"
      ? "Telemetry: mock HTTP server — click to use real MCU"
      : mcuConnectionPreset === "real"
        ? "Telemetry: real MCU — click to use mock server"
        : "Telemetry: custom MCU URL — click to switch to mock server";

  const icon =
    mcuConnectionPreset === "mock" ? (
      <Server className="h-4 w-4 text-emerald-400/90" strokeWidth={2} />
    ) : mcuConnectionPreset === "real" ? (
      <Cpu className="h-4 w-4 text-amber-400/90" strokeWidth={2} />
    ) : (
      <Link2 className="h-4 w-4 text-zinc-300/90" strokeWidth={2} />
    );

  const ringClass =
    mcuConnectionPreset === "mock"
      ? "ring-1 ring-emerald-500/35"
      : mcuConnectionPreset === "real"
        ? "ring-1 ring-amber-500/35"
        : "ring-1 ring-zinc-500/30";

  return (
    <TRNIconButton
      type="button"
      label={title}
      icon={icon}
      onClick={onToggle}
      className={twMerge(
        "pointer-events-auto border border-zinc-700/80 bg-zinc-900/90 text-zinc-200 shadow-md backdrop-blur-sm hover:bg-zinc-800/95",
        ringClass,
      )}
    />
  );
}
