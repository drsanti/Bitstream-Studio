import type { ReactNode } from "react";
import { Plug, PlugZap, Unplug } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { TRNHintTooltip } from "../ui/TRN/TRNHintTooltip.js";
import {
  BITSTREAM_SHELL_STATUS_CHIP_FRAME_CLASS,
  BITSTREAM_SHELL_STATUS_CHIP_ICON_CLASS,
  BITSTREAM_SHELL_STATUS_CHIP_TEXT_CLASS,
} from "../bitstream-shell/ui/workspace-chrome-chip.js";
import { getModelLoaderWsClientUrl } from "../runtimeWsUrls.js";

function normalizeBridgeState(state: string): "connected" | "disconnected" | "error" | "other" {
  const s = state.trim().toLowerCase();
  if (s === "connected") {
    return "connected";
  }
  if (s === "disconnected") {
    return "disconnected";
  }
  if (s === "error" || s.includes("fail")) {
    return "error";
  }
  return "other";
}

export function FreeAssetsLoaderConnectionChip(props: {
  isExtension: boolean;
  connectionState: string;
}): ReactNode {
  const { isExtension, connectionState } = props;

  if (isExtension) {
    return (
      <TRNHintTooltip
        trigger={
          <span
            className={twMerge(
              BITSTREAM_SHELL_STATUS_CHIP_FRAME_CLASS,
              "border-emerald-500/35 bg-emerald-950/40 text-emerald-200/90",
            )}
          >
            <PlugZap
              className={BITSTREAM_SHELL_STATUS_CHIP_ICON_CLASS}
              aria-hidden
            />
            <span className={BITSTREAM_SHELL_STATUS_CHIP_TEXT_CLASS}>Built-in broker</span>
          </span>
        }
        content="The VS Code extension hosts the model broker automatically. Sync writes to your per-user globalStorage assets folder."
        triggerAriaLabel="About built-in broker"
        placement="bottom-end"
        wide
      />
    );
  }

  const kind = normalizeBridgeState(connectionState);
  const label =
    kind === "connected"
      ? "Bridge connected"
      : kind === "disconnected"
        ? "Bridge offline"
        : kind === "error"
          ? "Bridge error"
          : `Bridge: ${connectionState}`;

  const toneClass =
    kind === "connected"
      ? "border-emerald-500/35 bg-emerald-950/40 text-emerald-200/90"
      : kind === "error"
        ? "border-rose-500/35 bg-rose-950/40 text-rose-200/90"
        : "border-amber-500/35 bg-amber-950/40 text-amber-200/90";

  const Icon = kind === "connected" ? Plug : Unplug;

  const hint = (
    <div className="space-y-2 text-[11px] leading-relaxed">
      <p>
        Browser mode uses the model downloader WebSocket at{" "}
        <span className="text-zinc-200">{getModelLoaderWsClientUrl()}</span>.
      </p>
      <p className="text-zinc-400">Start the bridge, then reload this page:</p>
      <code className="block rounded border border-zinc-700/80 bg-black/40 px-2 py-1 text-[10px] text-zinc-200">
        npm run dev:with-model-loader
      </code>
    </div>
  );

  return (
    <TRNHintTooltip
      trigger={
        <span className={twMerge(BITSTREAM_SHELL_STATUS_CHIP_FRAME_CLASS, toneClass)}>
          <Icon className={BITSTREAM_SHELL_STATUS_CHIP_ICON_CLASS} aria-hidden />
          <span className={BITSTREAM_SHELL_STATUS_CHIP_TEXT_CLASS}>{label}</span>
        </span>
      }
      content={hint}
      triggerAriaLabel="Bridge connection status"
      placement="bottom-end"
      wide
    />
  );
}
