/*******************************************************************************
 * File Name : E84SimulationPanel.tsx
 *
 * Description : Simulation mode controls (limits, speeds, noise, plotter).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { Gauge, Play, RotateCcw, Waves } from "lucide-react";
import { useMemo, useState } from "react";
import {
  TRNAccordion,
  TRNAccordionContent,
  TRNAccordionItem,
  TRNAccordionTrigger,
  TRNButton,
  TRNParameterSlider,
  TRNSectionContainer,
} from "../../../ui/TRN/index.js";
import { RotationDegPlotter } from "../../shared/ui/RotationDegPlotter.js";
import { useRotationDegHistory } from "../../shared/ui/useRotationDegHistory.js";
import { useE84MovementStore } from "../store/e84Movement.store.js";

/**
 * Auto-rotation settings and live rotation plot.
 */
export function E84SimulationPanel()
{
  const targetReady = useE84MovementStore((s) => s.targetReady);
  const isSimulating = useE84MovementStore((s) => s.isSimulating);
  const setIsSimulating = useE84MovementStore((s) => s.setIsSimulating);
  const settings = useE84MovementStore((s) => s.settings);
  const updateSetting = useE84MovementStore((s) => s.updateSetting);
  const resetSettings = useE84MovementStore((s) => s.resetSettings);
  const [scrollThreshold, setScrollThreshold] = useState(256);
  const history = useRotationDegHistory(
    () => useE84MovementStore.getState().liveRotationDeg,
    isSimulating && targetReady,
    scrollThreshold,
  );

  const plotSeries = useMemo(
    () => [
      { data: history.x, color: "#ef4444", label: "Rot X" },
      { data: history.y, color: "#22c55e", label: "Rot Y" },
      { data: history.z, color: "#3b82f6", label: "Rot Z" },
    ],
    [history.version, history.x, history.y, history.z],
  );

  if (!targetReady)
  {
    return (
      <p className="text-xs text-amber-300/90">
        E84_1 node not found in GLB. Check the model asset.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <TRNButton
          selected={isSimulating}
          size="compact"
          prefixIcon={<Play className="h-3.5 w-3.5" />}
          onClick={() => setIsSimulating(!isSimulating)}
        >
          {isSimulating ? "Stop" : "Start"}
        </TRNButton>
        <TRNButton
          size="compact"
          prefixIcon={<RotateCcw className="h-3.5 w-3.5" />}
          onClick={() => resetSettings()}
        >
          Defaults
        </TRNButton>
      </div>

      <TRNAccordion type="multiple" defaultValue={["limits", "noise", "plot"]}>
        <TRNAccordionItem value="limits">
          <TRNAccordionTrigger>
            <span className="flex items-center gap-2">
              <Gauge className="h-3.5 w-3.5" />
              Limits & speed
            </span>
          </TRNAccordionTrigger>
          <TRNAccordionContent>
            <TRNSectionContainer className="gap-1">
              <TRNParameterSlider
                name="Limit X"
                value={settings.limitX}
                min={1}
                max={45}
                step={1}
                unit="°"
                onChange={(v) => updateSetting("limitX", v)}
              />
              <TRNParameterSlider
                name="Limit Y"
                value={settings.limitY}
                min={1}
                max={45}
                step={1}
                unit="°"
                onChange={(v) => updateSetting("limitY", v)}
              />
              <TRNParameterSlider
                name="Limit Z"
                value={settings.limitZ}
                min={1}
                max={45}
                step={1}
                unit="°"
                onChange={(v) => updateSetting("limitZ", v)}
              />
              <TRNParameterSlider
                name="Speed X"
                value={settings.speedX}
                min={0.05}
                max={2}
                step={0.05}
                unit="Hz"
                onChange={(v) => updateSetting("speedX", v)}
              />
              <TRNParameterSlider
                name="Speed Y"
                value={settings.speedY}
                min={0.05}
                max={2}
                step={0.05}
                unit="Hz"
                onChange={(v) => updateSetting("speedY", v)}
              />
              <TRNParameterSlider
                name="Speed Z"
                value={settings.speedZ}
                min={0.05}
                max={2}
                step={0.05}
                unit="Hz"
                onChange={(v) => updateSetting("speedZ", v)}
              />
            </TRNSectionContainer>
          </TRNAccordionContent>
        </TRNAccordionItem>

        <TRNAccordionItem value="noise">
          <TRNAccordionTrigger>
            <span className="flex items-center gap-2">
              <Waves className="h-3.5 w-3.5" />
              Noise
            </span>
          </TRNAccordionTrigger>
          <TRNAccordionContent>
            <TRNSectionContainer className="gap-1">
              <TRNParameterSlider
                name="Scale X"
                value={settings.noiseScaleX}
                min={0}
                max={3}
                step={0.1}
                onChange={(v) => updateSetting("noiseScaleX", v)}
              />
              <TRNParameterSlider
                name="Scale Y"
                value={settings.noiseScaleY}
                min={0}
                max={3}
                step={0.1}
                onChange={(v) => updateSetting("noiseScaleY", v)}
              />
              <TRNParameterSlider
                name="Scale Z"
                value={settings.noiseScaleZ}
                min={0}
                max={3}
                step={0.1}
                onChange={(v) => updateSetting("noiseScaleZ", v)}
              />
              <TRNParameterSlider
                name="Freq X"
                value={settings.noiseFreqX}
                min={0.1}
                max={10}
                step={0.1}
                onChange={(v) => updateSetting("noiseFreqX", v)}
              />
              <TRNParameterSlider
                name="Freq Y"
                value={settings.noiseFreqY}
                min={0.1}
                max={10}
                step={0.1}
                onChange={(v) => updateSetting("noiseFreqY", v)}
              />
              <TRNParameterSlider
                name="Freq Z"
                value={settings.noiseFreqZ}
                min={0.1}
                max={10}
                step={0.1}
                onChange={(v) => updateSetting("noiseFreqZ", v)}
              />
            </TRNSectionContainer>
          </TRNAccordionContent>
        </TRNAccordionItem>

        <TRNAccordionItem value="plot">
          <TRNAccordionTrigger>Rotation plot</TRNAccordionTrigger>
          <TRNAccordionContent>
            <RotationDegPlotter
              series={plotSeries}
              scrollThreshold={scrollThreshold}
              live={isSimulating && targetReady}
            />
            <TRNParameterSlider
              name="Plot window"
              value={scrollThreshold}
              min={64}
              max={512}
              step={32}
              onChange={setScrollThreshold}
              valueFormatter={(v) => `${Math.round(v)} samples`}
            />
          </TRNAccordionContent>
        </TRNAccordionItem>
      </TRNAccordion>
    </div>
  );
}
