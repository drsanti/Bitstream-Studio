import { TRNButton } from "../../../ui/TRN/TRNButton";
import { TRNInteractiveCard } from "../../../ui/TRN/TRNInteractiveCard";
import type { Project4McuConnectionPreset } from "../../settings/project4-settings.types";
import {
  MCU_CONNECTION_PRESET_MOCK,
  MCU_CONNECTION_PRESET_REAL,
  REAL_MCU_DEFAULT_HOST,
  mcuBaseUrlFromPreset,
} from "../../lib/mcu-connection-presets";

export type Project4ConnectionPresetCardsProps = {
  mcuConnectionPreset: Project4McuConnectionPreset;
  mcuBaseUrl: string;
  onApplyPresetUrl: (url: string) => void;
  /** Scroll/focus helper for the manual connection row (optional). */
  onScrollToManual?: () => void;
};

function ActiveBadge() {
  return (
    <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-emerald-300 ring-1 ring-emerald-500/35">
      Active
    </span>
  );
}

export function Project4ConnectionPresetCards(props: Project4ConnectionPresetCardsProps) {
  const preset = props.mcuConnectionPreset;

  const mockUrl = mcuBaseUrlFromPreset(MCU_CONNECTION_PRESET_MOCK);
  const realUrl = mcuBaseUrlFromPreset(MCU_CONNECTION_PRESET_REAL);

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      <TRNInteractiveCard
        title="Mock HTTP server"
        collapsible={false}
        titleTrailingSlot={preset === "mock" ? <ActiveBadge /> : null}
        className={
          "border-zinc-700/90 bg-zinc-950/90 text-zinc-100 " +
          (preset === "mock"
            ? "ring-1 ring-emerald-500/25"
            : "")
        }
        headerClassName="border-zinc-700/70"
      >
        <div className="flex flex-col gap-3 text-xs leading-relaxed text-zinc-400">
          <p>
            Local simulator (<span className="font-mono text-zinc-300">npm run project4:mock-mcu</span>{" "}
            or <span className="font-mono text-zinc-300">npm run dev:with-mock-mcu</span>). Default{" "}
            <span className="font-mono text-zinc-400">{mockUrl}</span>
            — change port with <span className="font-mono text-zinc-500">MOCK_MCU_PORT</span> then edit the
            connection row below if needed.
          </p>
          <TRNButton
            type="button"
            size="compact"
            className={
              preset === "mock"
                ? "border-emerald-700/50 bg-emerald-950/40 hover:bg-emerald-950/55"
                : ""
            }
            onClick={() => props.onApplyPresetUrl(mockUrl)}
          >
            Use mock server
          </TRNButton>
        </div>
      </TRNInteractiveCard>

      <TRNInteractiveCard
        title="Real microcontroller"
        collapsible={false}
        titleTrailingSlot={preset === "real" ? <ActiveBadge /> : null}
        className={
          "border-zinc-700/90 bg-zinc-950/90 text-zinc-100 " +
          (preset === "real"
            ? "ring-1 ring-emerald-500/25"
            : "")
        }
        headerClassName="border-zinc-700/70"
      >
        <div className="flex flex-col gap-3 text-xs leading-relaxed text-zinc-400">
          <p>
            Hardware HTTP API on the LAN — typical AP address{" "}
            <span className="font-mono text-zinc-400">{realUrl}</span>{" "}
            ({REAL_MCU_DEFAULT_HOST}, default HTTP port). Adjust host if your board uses another IP or mDNS.
          </p>
          <TRNButton
            type="button"
            size="compact"
            className={
              preset === "real"
                ? "border-emerald-700/50 bg-emerald-950/40 hover:bg-emerald-950/55"
                : ""
            }
            onClick={() => props.onApplyPresetUrl(realUrl)}
          >
            Use real MCU
          </TRNButton>
        </div>
      </TRNInteractiveCard>

      <TRNInteractiveCard
        title="Custom connection"
        collapsible={false}
        titleTrailingSlot={preset === "custom" ? <ActiveBadge /> : null}
        className={
          "border-zinc-700/90 bg-zinc-950/90 text-zinc-100 " +
          (preset === "custom"
            ? "ring-1 ring-emerald-500/25"
            : "")
        }
        headerClassName="border-zinc-700/70"
      >
        <div className="flex flex-col gap-3 text-xs leading-relaxed text-zinc-400">
          <p>
            Host, port, or scheme differs from the mock server (
            <span className="font-mono text-zinc-400">{mockUrl}</span>
            ) or default real MCU (
            <span className="font-mono text-zinc-400">{realUrl}</span>
            ,{" "}
            <span className="font-mono text-zinc-500">{REAL_MCU_DEFAULT_HOST}</span>
            ). Current base URL{" "}
            <span className="font-mono text-zinc-300">{props.mcuBaseUrl}</span>.
          </p>
          {props.onScrollToManual ? (
            <TRNButton
              type="button"
              size="compact"
              className={
                preset === "custom"
                  ? "border-emerald-700/50 bg-emerald-950/40 hover:bg-emerald-950/55"
                  : ""
              }
              onClick={() => props.onScrollToManual?.()}
            >
              Go to manual fields
            </TRNButton>
          ) : null}
        </div>
      </TRNInteractiveCard>
    </div>
  );
}
