import type { Edge } from "@xyflow/react";
import { getEngineEnvironmentCubeMaps } from "@/engine-environment/t3dEngineEnvironment";
import { useCallback, useMemo } from "react";
import {
  TRNParameterSlider,
  TRNSelect,
  TRNToggleSwitch,
  type TRNSelectOption,
} from "../../../../../ui/TRN";
import { useStudioAssetDescriptors } from "../../../asset-browser/useStudioAssetDescriptors";
import {
  scene3dInspectorEnvironmentCatalogSelectValue,
  STUDIO_ENVIRONMENT_T3D_PRESET_VALUE_PREFIX,
} from "../../../asset-browser/studio-environment-scene-bindings";
import {
  applyEnvironmentCubemapSelectToNodeConfig,
  buildEnvironmentCubemapSelectOptions,
} from "./environment-cubemap-select";
import {
  environmentModulationHandleIsWired,
  readEnvironmentInputSocketVisibility,
} from "./environment-node-inputs";
import {
  flowWireEnvironmentFromNodeDefaultConfig,
  type FlowWireEnvironmentV1,
} from "./flow-wire-environment";
import { FlowNodeIntrinsicWidthMarker } from "../flow-node/FlowNodeIntrinsicWidthMarker";
import {
  FLOW_NODE_BODY_PANEL_CLASS,
  widestTrnSelectOptionLabel,
} from "../flow-node/flow-node-intrinsic-width-utils";
import { FLOW_NODE_TRN_SELECT_CLASS } from "../flow-node/flow-node-trn-select-layout";

export type EnvironmentNodeControlsProps = {
  defaultConfig: Record<string, unknown>;
  onUpdateField: (key: string, value: unknown) => void;
  /**
   * Flow node card: when a modulation pin is exposed for a field, omit that manual row to save space
   * and avoid duplicate affordances. Inspector should omit this flag so all parameters stay visible.
   */
  compactForFlowNodeBody?: boolean;
  /** Used with inspector wiring: disable a field when its pin has an incoming edge (wire wins). */
  edges?: readonly Edge[] | undefined;
  nodeId?: string;
};

/**
 * Manual fields for the Environment node. With **`compactForFlowNodeBody`**, rows for fields that
 * have an exposed modulation pin are omitted (canvas only). The inspector omits that flag and keeps
 * every row; optional **`edges` + `nodeId`** disable fields that are actively driven by a wire.
 */
export function EnvironmentNodeControls(props: EnvironmentNodeControlsProps) {
  const { defaultConfig, onUpdateField, compactForFlowNodeBody = false, edges, nodeId } = props;
  const { descriptors } = useStudioAssetDescriptors();

  const vis = useMemo(
    () => readEnvironmentInputSocketVisibility(defaultConfig),
    [defaultConfig],
  );

  const wire = useMemo(
    () => flowWireEnvironmentFromNodeDefaultConfig(defaultConfig),
    [defaultConfig],
  );

  const omitRow = (handleId: keyof typeof vis) =>
    compactForFlowNodeBody && vis[handleId] === true;

  const showUseIbl = !omitRow("useCubemapIbl");
  const showBackground = !omitRow("showBackgroundTexture");
  const showIblStrength = !omitRow("iblStrength");
  const showIblOff = !omitRow("iblOffStrengthFrac");
  const showYaw = !omitRow("yawDeg");

  const iblWired =
    !compactForFlowNodeBody &&
    nodeId != null &&
    environmentModulationHandleIsWired(edges, nodeId, "useCubemapIbl", vis);
  const bgWired =
    !compactForFlowNodeBody &&
    nodeId != null &&
    environmentModulationHandleIsWired(edges, nodeId, "showBackgroundTexture", vis);
  const iblStrWired =
    !compactForFlowNodeBody &&
    nodeId != null &&
    environmentModulationHandleIsWired(edges, nodeId, "iblStrength", vis);
  const iblOffWired =
    !compactForFlowNodeBody &&
    nodeId != null &&
    environmentModulationHandleIsWired(edges, nodeId, "iblOffStrengthFrac", vis);
  const yawWired =
    !compactForFlowNodeBody &&
    nodeId != null &&
    environmentModulationHandleIsWired(edges, nodeId, "yawDeg", vis);

  const environmentSelectOptions = useMemo<TRNSelectOption[]>(
    () => buildEnvironmentCubemapSelectOptions(descriptors, wire),
    [descriptors, wire.presetIndex, wire.studioAssetId],
  );

  const selectValue = useMemo(
    () =>
      scene3dInspectorEnvironmentCatalogSelectValue(
        { presetIndex: wire.presetIndex, studioAssetId: wire.studioAssetId },
        descriptors,
        getEngineEnvironmentCubeMaps(),
      ),
    [descriptors, wire.presetIndex, wire.studioAssetId],
  );

  const applyCubemapSelect = useCallback(
    (value: string) => {
      applyEnvironmentCubemapSelectToNodeConfig(value, descriptors, defaultConfig, onUpdateField);
    },
    [defaultConfig, descriptors, onUpdateField],
  );

  const patchWire = useCallback(
    (patch: Partial<FlowWireEnvironmentV1>) => {
      for (const [k, v] of Object.entries(patch)) {
        onUpdateField(k, v);
      }
    },
    [onUpdateField],
  );

  const cubemapIntrinsicLabels = useMemo(() => {
    const opts =
      environmentSelectOptions.length > 0
        ? environmentSelectOptions
        : [{ value: `${STUDIO_ENVIRONMENT_T3D_PRESET_VALUE_PREFIX}0`, label: "(no presets)" }];
    const selected =
      opts.find((o) => o.value === selectValue)?.label?.trim() ?? "";
    const widest = widestTrnSelectOptionLabel(opts);
    return selected.length > 0 ? [selected, widest, "Cubemap / HDRI"] : [widest, "Cubemap / HDRI"];
  }, [environmentSelectOptions, selectValue]);

  return (
    <div
      className={
        compactForFlowNodeBody
          ? `${FLOW_NODE_BODY_PANEL_CLASS} space-y-2`
          : "min-w-0 space-y-2"
      }
      data-flow-node-body-panel={compactForFlowNodeBody ? true : undefined}
    >
      {compactForFlowNodeBody ? (
        <FlowNodeIntrinsicWidthMarker labels={cubemapIntrinsicLabels} />
      ) : null}
      <div className="min-w-0">
        <div className="mb-0.5 block text-[11px] font-medium text-zinc-400">Cubemap / HDRI</div>
        <TRNSelect
          ariaLabel="Environment cubemap preset"
          sectionTitle="Cubemap preset"
          size="sm"
          value={selectValue}
          className={FLOW_NODE_TRN_SELECT_CLASS}
          buttonClassName="w-full min-w-0 max-w-full text-[12px]"
          options={
            environmentSelectOptions.length > 0
              ? environmentSelectOptions
              : [{ value: `${STUDIO_ENVIRONMENT_T3D_PRESET_VALUE_PREFIX}0`, label: "(no presets)" }]
          }
          onValueChange={applyCubemapSelect}
          panelClassName="scrollbar-hide max-h-60 overflow-y-auto"
        />
      </div>

      {showUseIbl ? (
        <div className="flex items-center justify-between rounded border border-zinc-700/80 bg-transparent px-2 py-1">
          <span className="text-xs font-medium text-zinc-200">Use IBL</span>
          <span title={iblWired ? "Driven by a connected wire" : undefined}>
            <TRNToggleSwitch
              checked={wire.useCubemapIbl}
              ariaLabel="Toggle IBL reflections"
              disabled={iblWired}
              onCheckedChange={(checked) => patchWire({ useCubemapIbl: checked })}
            />
          </span>
        </div>
      ) : null}

      {showBackground ? (
        <div className="flex items-center justify-between rounded border border-zinc-700/80 bg-transparent px-2 py-1">
          <span className="text-xs font-medium text-zinc-200">Background texture</span>
          <span title={bgWired ? "Driven by a connected wire" : undefined}>
            <TRNToggleSwitch
              checked={wire.showBackgroundTexture}
              ariaLabel="Toggle background cubemap texture"
              disabled={bgWired}
              onCheckedChange={(checked) => patchWire({ showBackgroundTexture: checked })}
            />
          </span>
        </div>
      ) : null}

      {showIblStrength ? (
        <TRNParameterSlider
          valueScrubEnabled
          name="IBL strength"
          nameTitle={iblStrWired ? "Driven by a connected wire" : undefined}
          value={wire.iblStrength}
          min={0}
          max={3}
          step={0.05}
          unit="×"
          valueFormatter={(v) => v.toFixed(2)}
          disabled={iblStrWired}
          onChange={(v) => patchWire({ iblStrength: v })}
        />
      ) : null}

      {showIblOff ? (
        <TRNParameterSlider
          valueScrubEnabled
          name="IBL off strength"
          nameTitle={iblOffWired ? "Driven by a connected wire" : undefined}
          value={wire.iblOffStrengthFrac}
          min={0}
          max={1}
          step={0.01}
          unit=""
          valueFormatter={(v) => v.toFixed(2)}
          disabled={iblOffWired}
          onChange={(v) => patchWire({ iblOffStrengthFrac: v })}
        />
      ) : null}

      {showYaw ? (
        <TRNParameterSlider
          valueScrubEnabled
          name="Environment yaw"
          nameTitle={yawWired ? "Driven by a connected wire" : undefined}
          value={wire.yawDeg}
          min={-180}
          max={180}
          step={1}
          unit="°"
          valueFormatter={(v) => `${Math.round(v)}°`}
          disabled={yawWired}
          onChange={(v) => patchWire({ yawDeg: v })}
        />
      ) : null}
    </div>
  );
}
