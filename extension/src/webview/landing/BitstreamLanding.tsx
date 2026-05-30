/*******************************************************************************
 * File Name : BitstreamLanding.tsx
 *
 * Description : Browser dev landing — pick Sensor Telemetry or Sensor Studio with
 *               animated canvas backdrop (t3d-extension launcher pattern).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { useCallback, type MouseEvent } from "react";
import { useBitstreamWorkspaceModeStore } from "../bitstream-app/state/bitstreamWorkspaceMode.store.js";
import type { BitstreamWorkspaceId } from "../bitstream-app/state/bitstreamWorkspaceMode.store.js";
import { BitstreamLandingBackground } from "./BitstreamLandingBackground.js";
import { BitstreamLandingBackgroundModeHint } from "./BitstreamLandingBackgroundModeHint.js";
import { useBitstreamLandingBackgroundModeStore } from "./bitstreamLandingBackgroundMode.store.js";
import { BitstreamLandingOptionCard } from "./BitstreamLandingOptionCard.js";
import { commitBitstreamLandingChoice } from "./bitstreamLandingNav.js";
import { BITSTREAM_LANDING_OPTIONS } from "./landingOptions.js";
import { SIMULATION_CATALOG } from "../simulations/catalog/simulationCatalog.js";
import type { SimulationId } from "../simulations/catalog/simulationIds.js";
import { SimulationLandingOptionCard } from "./SimulationLandingOptionCard.js";
import { LandingCardsParallax } from "./css3d/LandingCardsParallax.js";
import { shouldUseLandingCss3d } from "./css3d/shouldUseLandingCss3d.js";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion.js";

export type BitstreamLandingProps = {
  onEnter: (workspace: BitstreamWorkspaceId) => void;
  onOpenSimulation: (id: SimulationId) => void;
};

/**
 * Full-viewport workspace picker for Vite dev (`http://localhost:5173/`).
 */
export function BitstreamLanding({ onEnter, onOpenSimulation }: BitstreamLandingProps)
{
  const handleChoose = (workspace: BitstreamWorkspaceId) =>
  {
    useBitstreamWorkspaceModeStore.getState().setWorkspace(workspace);
    commitBitstreamLandingChoice(workspace);
    onEnter();
  };

  const handleOpenSimulation = (id: SimulationId) =>
  {
    onOpenSimulation(id);
  };

  const cycleBackgroundMode = useBitstreamLandingBackgroundModeStore((s) => s.cycleMode);
  const cycleOverlay = useBitstreamLandingBackgroundModeStore((s) => s.cycleOverlay);
  const backdropMode = useBitstreamLandingBackgroundModeStore((s) => s.mode);
  const prefersReducedMotion = usePrefersReducedMotion();
  const cardParallaxEnabled = shouldUseLandingCss3d(backdropMode, prefersReducedMotion);

  /** Double-click: backdrop mode. Shift+double-click: nebula/flow overlay preset. */
  const handleLandingDoubleClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) =>
    {
      const target = event.target as HTMLElement;
      if (target.closest("button, a, input, textarea, select, [role='dialog']"))
      {
        return;
      }
      if (event.shiftKey)
      {
        cycleOverlay();
        return;
      }
      cycleBackgroundMode();
    },
    [cycleBackgroundMode, cycleOverlay],
  );

  return (
    <div
      className="webview-launcher t3d-shell-overlay fixed inset-0 z-500 flex min-h-0 flex-col overflow-y-auto overscroll-contain"
      onDoubleClick={handleLandingDoubleClick}
    >
      <BitstreamLandingBackground />
      <BitstreamLandingBackgroundModeHint />

      <div className="webview-launcher__content pointer-events-auto relative z-[15] mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-10 sm:px-6 sm:py-14">
        <header className="webview-launcher-hero mb-10 text-center sm:mb-12">
          <p className="text-xs font-semibold tracking-[0.35em] text-sky-400/80 uppercase">
            TESA · TESAIoT
          </p>
          <h1 className="mt-4 bg-linear-to-r from-sky-200 via-zinc-50 to-emerald-200 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
            Bitstream Studio
          </h1>
          <p className="webview-launcher-hero__subtitle mx-auto mt-5 max-w-2xl text-base font-medium tracking-wide text-zinc-300 sm:text-lg">
            Sensor workspaces and Digital Twin simulations
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-500 sm:text-base">
            BS2 telemetry, Sensor Studio flows, or 3D machine simulations — pick a
            workspace or simulation to begin.
          </p>
        </header>

        <section>
          <h2 className="mb-3 text-xs font-semibold tracking-[0.25em] text-zinc-500 uppercase">
            Sensor workspaces
          </h2>
          <LandingCardsParallax enabled={cardParallaxEnabled}>
            <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
              {BITSTREAM_LANDING_OPTIONS.map((option, index) => (
                <BitstreamLandingOptionCard
                  key={option.workspace}
                  option={option}
                  index={index}
                  onSelect={() => handleChoose(option.workspace)}
                />
              ))}
            </div>
          </LandingCardsParallax>
        </section>

        <section className="mt-10">
          <h2 className="mb-3 text-xs font-semibold tracking-[0.25em] text-zinc-500 uppercase">
            Digital Twin simulations
          </h2>
          <LandingCardsParallax enabled={cardParallaxEnabled}>
            <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
              {SIMULATION_CATALOG.map((option, index) => (
                <SimulationLandingOptionCard
                  key={option.id}
                  option={option}
                  index={index}
                  onSelect={() => handleOpenSimulation(option.id)}
                />
              ))}
            </div>
          </LandingCardsParallax>
        </section>
      </div>
    </div>
  );
}
