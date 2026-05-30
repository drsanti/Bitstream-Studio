/*******************************************************************************
 * File Name : E84ManualPanel.tsx
 *
 * Description : Manual transform mode UI (gizmo mode/space, reset, plot).
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.0
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import { Globe, Layers, Maximize2, Move, Move3d, RotateCcw, RotateCw } from "lucide-react";
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
import {
  useE84MovementStore,
  type E84TransformMode,
  type E84TransformSpace,
} from "../store/e84Movement.store.js";

type ModeOption = { id: E84TransformMode; label: string; icon: typeof Move };

const TRANSFORM_MODES: ModeOption[] = [
  { id: "translate", label: "Move", icon: Move },
  { id: "rotate", label: "Rotate", icon: RotateCw },
  { id: "scale", label: "Scale", icon: Maximize2 },
];

/**
 * Manual gizmo controls; rotation plot follows live telemetry from scene.
 */
export function E84ManualPanel()
{
  const targetReady = useE84MovementStore((s) => s.targetReady);
  const transformMode = useE84MovementStore((s) => s.transformMode);
  const transformSpace = useE84MovementStore((s) => s.transformSpace);
  const setTransformMode = useE84MovementStore((s) => s.setTransformMode);
  const setTransformSpace = useE84MovementStore((s) => s.setTransformSpace);
  const liveRotationDeg = useE84MovementStore((s) => s.liveRotationDeg);
  const requestResetTransform = useE84MovementStore((s) => s.requestResetTransform);

  const [scrollThreshold, setScrollThreshold] = useState(256);

  const history = useRotationDegHistory(
    () => useE84MovementStore.getState().liveRotationDeg,
    targetReady,
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
        E84_1 node not found. Switch to Simulation or check the GLB.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[11px] text-zinc-500">
        Drag the gizmo on the model. Orbit controls resume when you release.
      </p>

      <TRNSectionContainer title="Coordinate space">
        <SegmentRow<E84TransformSpace>
          value={transformSpace}
          options={[
            { id: "world", label: "World", icon: Globe },
            { id: "local", label: "Local", icon: Layers },
          ]}
          onChange={setTransformSpace}
        />
      </TRNSectionContainer>

      <TRNSectionContainer title="Transform mode">
        <SegmentRow<E84TransformMode>
          value={transformMode}
          options={TRANSFORM_MODES}
          onChange={setTransformMode}
        />
      </TRNSectionContainer>

      <TRNButton
        size="compact"
        className="w-full"
        prefixIcon={<RotateCcw className="h-3.5 w-3.5" />}
        onClick={() => requestResetTransform()}
      >
        Reset position, rotation & scale
      </TRNButton>

      <TRNAccordion type="single" defaultValue="plot" collapsible>
        <TRNAccordionItem value="plot">
          <TRNAccordionTrigger>
            <span className="flex items-center gap-2">
              <Move3d className="h-3.5 w-3.5" />
              Rotation plot
            </span>
          </TRNAccordionTrigger>
          <TRNAccordionContent>
            <RotationDegPlotter
              series={plotSeries}
              scrollThreshold={scrollThreshold}
              live={targetReady}
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

        <TRNAccordionItem value="readout">
          <TRNAccordionTrigger>Live readout (°)</TRNAccordionTrigger>
          <TRNAccordionContent>
            {liveRotationDeg != null ? (
              <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                <Readout label="X" value={liveRotationDeg.x} color="text-red-400" />
                <Readout label="Y" value={liveRotationDeg.y} color="text-emerald-400" />
                <Readout label="Z" value={liveRotationDeg.z} color="text-sky-400" />
              </div>
            ) : (
              <p className="text-xs text-zinc-500">No rotation data yet.</p>
            )}
          </TRNAccordionContent>
        </TRNAccordionItem>
      </TRNAccordion>
    </div>
  );
}

type SegmentRowProps<T extends string> = {
  value: T;
  options: { id: T; label: string; icon: typeof Move }[];
  onChange: (value: T) => void;
};

function SegmentRow<T extends string>({
  value,
  options,
  onChange,
}: SegmentRowProps<T>)
{
  return (
    <div className="flex gap-1">
      {options.map((opt) =>
      {
        const Icon = opt.icon;
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            className={
              active
                ? "flex flex-1 items-center justify-center gap-1 rounded-md border border-sky-500/40 bg-sky-950/50 py-1.5 text-[11px] text-sky-100"
                : "flex flex-1 items-center justify-center gap-1 rounded-md border border-zinc-700 py-1.5 text-[11px] text-zinc-400 hover:bg-zinc-900"
            }
            onClick={() => onChange(opt.id)}
          >
            <Icon className="h-3 w-3" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function Readout({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
})
{
  return (
    <div className="rounded border border-zinc-800 bg-zinc-900/60 px-2 py-1.5">
      <span className="text-zinc-500">{label} </span>
      <span className={color}>{value.toFixed(2)}</span>
    </div>
  );
}
