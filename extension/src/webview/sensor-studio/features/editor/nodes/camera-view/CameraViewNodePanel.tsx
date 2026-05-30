import { useCallback, useMemo } from "react";
import {
  TRNParameterSlider,
  TRNTransformSection,
  TRNToggleSwitch,
  TRNVector3Field,
} from "../../../../../ui/TRN";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import { ReadingLabel } from "../flow-node/readings/ReadingLabel";
import { ReadingPanel } from "../flow-node/readings/ReadingPanel";
import {
  defaultFlowWireCameraV1,
  flowWireCameraFromNodeDefaultConfig,
  type FlowWireCameraV1,
} from "./flow-wire-camera";

export type CameraViewNodePanelProps = {
  nodeId: string;
  defaultConfig: Record<string, unknown>;
};

export function CameraViewNodePanel(props: CameraViewNodePanelProps) {
  const { nodeId, defaultConfig } = props;
  const updateField = useFlowEditorStore((s) => s.updateNodeConfigFieldByNodeId);

  const wire = useMemo(
    () => flowWireCameraFromNodeDefaultConfig(defaultConfig),
    [defaultConfig],
  );

  const patchWire = useCallback(
    (patch: Partial<FlowWireCameraV1>) => {
      for (const [k, v] of Object.entries(patch)) {
        updateField(nodeId, k, v);
      }
    },
    [nodeId, updateField],
  );

  const maxUnlimited = wire.controls.maxDistance == null;

  return (
    <ReadingPanel className="space-y-2">
      <ReadingLabel className="mb-0.5 block">Camera</ReadingLabel>

      <TRNParameterSlider
        valueScrubEnabled
        name="FOV"
        value={wire.fovDeg}
        min={10}
        max={120}
        step={1}
        unit="deg"
        valueFormatter={(v) => String(Math.round(v))}
        onChange={(v) => patchWire({ fovDeg: Math.round(v) })}
      />

      <TRNParameterSlider
        valueScrubEnabled
        name="Frame margin"
        value={wire.frameMargin}
        min={0.9}
        max={3}
        step={0.02}
        unit="×"
        valueFormatter={(v) => v.toFixed(2)}
        onChange={(v) => patchWire({ frameMargin: v })}
      />

      <div className="text-[10px] font-semibold text-zinc-400">View direction (world)</div>
      <TRNVector3Field
        label="Dir"
        value={wire.frameDirection}
        onChange={(next) => patchWire({ frameDirection: next })}
        step={0.05}
        pointerScrubEnabled
      />

      <div className="grid grid-cols-2 gap-2">
        <TRNParameterSlider
          valueScrubEnabled
          name="Near ÷"
          value={wire.nearDivisor}
          min={20}
          max={2000}
          step={10}
          unit=""
          valueFormatter={(v) => String(Math.round(v))}
          onChange={(v) => patchWire({ nearDivisor: Math.round(v) })}
        />
        <TRNParameterSlider
          valueScrubEnabled
          name="Far ×"
          value={wire.farMultiplier}
          min={10}
          max={5000}
          step={10}
          unit=""
          valueFormatter={(v) => String(Math.round(v))}
          onChange={(v) => patchWire({ farMultiplier: Math.round(v) })}
        />
      </div>

      <TRNTransformSection
        title="Camera position"
        value={{
          position: wire.transform.position,
          rotationDeg: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          uniformScale: true,
        }}
        onChange={(next) =>
          patchWire({
            transform: { ...wire.transform, position: next.position },
          })
        }
        showRotation={false}
        showScale={false}
      />

      <TRNTransformSection
        title="Look-at target"
        value={{
          position: wire.transform.target,
          rotationDeg: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          uniformScale: true,
        }}
        onChange={(next) =>
          patchWire({
            transform: { ...wire.transform, target: next.position },
          })
        }
        showRotation={false}
        showScale={false}
      />

      <div className="border-t border-zinc-700/60 pt-2 text-[10px] font-semibold text-zinc-400">
        Orbit limits
      </div>

      <TRNParameterSlider
        valueScrubEnabled
        name="Min distance"
        value={wire.controls.minDistance}
        min={0}
        max={50}
        step={0.05}
        unit=""
        valueFormatter={(v) => v.toFixed(2)}
        onChange={(v) =>
          patchWire({
            controls: { ...wire.controls, minDistance: v },
          })
        }
      />

      <div className="flex items-center justify-between rounded border border-zinc-700/80 bg-transparent px-2 py-1">
        <span className="text-xs font-medium text-zinc-200">Unlimited max distance</span>
        <TRNToggleSwitch
          checked={maxUnlimited}
          ariaLabel="Toggle unlimited orbit max distance"
          onCheckedChange={(checked) =>
            patchWire({
              controls: {
                ...wire.controls,
                maxDistance: checked ? null : defaultFlowWireCameraV1().controls.maxDistance ?? 200,
              },
            })
          }
        />
      </div>

      {!maxUnlimited ? (
        <TRNParameterSlider
          valueScrubEnabled
          name="Max distance"
          value={wire.controls.maxDistance ?? 200}
          min={0.5}
          max={500}
          step={0.5}
          unit=""
          valueFormatter={(v) => v.toFixed(1)}
          onChange={(v) =>
            patchWire({
              controls: { ...wire.controls, maxDistance: v },
            })
          }
        />
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <TRNParameterSlider
          valueScrubEnabled
          name="Min polar"
          value={wire.controls.minPolarAngleDeg}
          min={0}
          max={180}
          step={1}
          unit="°"
          valueFormatter={(v) => `${Math.round(v)}°`}
          onChange={(v) =>
            patchWire({
              controls: { ...wire.controls, minPolarAngleDeg: Math.round(v) },
            })
          }
        />
        <TRNParameterSlider
          valueScrubEnabled
          name="Max polar"
          value={wire.controls.maxPolarAngleDeg}
          min={0}
          max={180}
          step={1}
          unit="°"
          valueFormatter={(v) => `${Math.round(v)}°`}
          onChange={(v) =>
            patchWire({
              controls: { ...wire.controls, maxPolarAngleDeg: Math.round(v) },
            })
          }
        />
      </div>
    </ReadingPanel>
  );
}
