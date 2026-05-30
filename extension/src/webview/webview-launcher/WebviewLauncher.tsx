import { useState } from "react";
import { useWebviewEntryStore } from "../state/webviewEntry.store";
import { WebviewLauncherBitstreamPicker } from "./WebviewLauncherBitstreamPicker";
import { LAUNCHER_OPTIONS } from "./launcherOptions";
import { WebviewLauncherBackground } from "./WebviewLauncherBackground";
import { WebviewLauncherOptionCard } from "./WebviewLauncherOptionCard";
import { WebviewLauncherPartnerLogo } from "./WebviewLauncherPartnerLogo";
import { WebviewLauncherTesaiotLogo } from "./WebviewLauncherTesaiotLogo";

function ShortcutKey({ combo }: { combo: string }) {
  return (
    <kbd className="justify-self-end rounded border border-zinc-700/80 bg-zinc-950/80 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300 whitespace-nowrap">
      {combo}
    </kbd>
  );
}

/**
 * Full-viewport landing page for choosing Digital Twin vs Bitstream (browser dev).
 */
export function WebviewLauncher() {
  const requestEntrySwitch = useWebviewEntryStore((s) => s.requestEntrySwitch);
  const requestBitstreamEntrySwitch = useWebviewEntryStore((s) => s.requestBitstreamEntrySwitch);
  const [bitstreamPickerOpen, setBitstreamPickerOpen] = useState(false);

  return (
    <div className="webview-launcher t3d-shell-overlay fixed inset-0 z-500 flex min-h-0 flex-col overflow-y-auto overscroll-contain">
      <WebviewLauncherBackground />

      <div className="webview-launcher__content relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-10 sm:px-6 sm:py-14">
        <header className="webview-launcher-hero mb-10 text-center sm:mb-12">
          <h1 className="sr-only">TESA and TESAIoT</h1>
          <div className="webview-launcher-hero__brands mx-auto flex max-w-[min(92vw,32rem)] flex-col items-center gap-4 sm:gap-5">
            <WebviewLauncherPartnerLogo />
            <WebviewLauncherTesaiotLogo />
          </div>
          <p className="webview-launcher-hero__subtitle mx-auto mt-5 max-w-2xl text-base font-medium tracking-wide text-zinc-300 sm:text-lg md:text-xl">
            TERNION Digital Twin and Sensor Studio
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-500 sm:text-base">
            Where live machine data drives 3D twins, and live sensor streams power configure,
            diagnostics, and flow studios. One platform, two workspaces.
          </p>
        </header>

        <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
          {LAUNCHER_OPTIONS.map((option, index) => (
            <WebviewLauncherOptionCard
              key={option.entry}
              option={option}
              index={index}
              actionLabel={option.entry === "bitstream" ? "Choose" : "Open"}
              onSelect={() => {
                if (option.entry === "bitstream") {
                  setBitstreamPickerOpen(true);
                  return;
                }
                requestEntrySwitch(option.entry);
              }}
            />
          ))}
        </div>

        {bitstreamPickerOpen ? (
          <WebviewLauncherBitstreamPicker
            onBack={() => {
              setBitstreamPickerOpen(false);
            }}
            onChoose={(workspace) => {
              setBitstreamPickerOpen(false);
              requestBitstreamEntrySwitch(workspace);
            }}
          />
        ) : null}

        {import.meta.env.DEV ? (
          <footer className="webview-launcher-footer mt-10 text-center text-[11px] leading-relaxed text-zinc-500">
            <p className="font-medium tracking-wide text-zinc-400 uppercase">
              Keyboard shortcut
            </p>
            <ul className="mx-auto mt-2 inline-grid max-w-lg grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-left text-zinc-500">
              <li className="contents">
                <ShortcutKey combo="Ctrl+/" />
                <span>Quick Actions palette (all apps)</span>
              </li>
            </ul>
          </footer>
        ) : null}
      </div>
    </div>
  );
}
