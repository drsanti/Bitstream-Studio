import { LayoutGrid, MonitorPlay, SlidersHorizontal } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
  TRNTabs,
  TRNTabsList,
  TRNTabsTrigger,
  TRN_INSPECTOR_PANEL_BODY_COLUMN_CLASS,
  TRN_INSPECTOR_PANEL_SCROLL_CLASS,
  TRN_INSPECTOR_PANEL_SHELL_CLASS,
  TRN_INSPECTOR_TAB_BAR_WRAP_CLASS,
  TRN_INSPECTOR_TAB_LIST_CLASS,
  TRN_INSPECTOR_TAB_TRIGGER_CLASS,
  TRN_INSPECTOR_TAB_ACTIVE_CLASS,
} from "../../../../../ui/TRN";
import { StageInspectorContextBar } from "./StageInspectorContextBar";
import {
  applyStageScene3dPresentation,
  stageSceneOutputDefaultScene3d,
} from "../../../../core/stage/stage-scene-defaults";
import {
  coerceScene3DConfigV1,
  persistScene3DConfig,
} from "../../../../core/scene3d/scene3d-config";
import { useStageSceneStore } from "../../../../state/stage-scene.store";
import { useStageViewportNavigationStore } from "../../../../state/stage-viewport-navigation.store";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import type { StagePresentationPreferences } from "../../../stage/stage-presentation-preferences";
import { getStageEnvironmentWireContext } from "../../../stage/stage-viewport-helpers";
import { InspectorCompactToggleRow } from "./InspectorCompactToggleRow";
import { StageMeshesOnlyScenePreferencesSection } from "./StageMeshesOnlyScenePreferencesSection";
import { InspectorSettingsSectionFrame } from "./InspectorSettingsSectionFrame";
import { StageInspectorScene3dTab } from "./StageInspectorScene3dTab";
import { StageInspectorToolbarTab } from "./StageInspectorToolbarTab";
import {
  readStoredStageInspectorTab,
  writeStoredStageInspectorTab,
  type StageInspectorTab,
} from "./stage-inspector-ui-persistence";

export type StageInspectorPanelProps = {
  stagePresentationPreferences: StagePresentationPreferences;
  onStagePresentationPreferencesChange: (
    patch: Partial<StagePresentationPreferences>,
  ) => void;
  /** Nested under {@link StageWorkbenchInspectorPanel} — omit outer chrome. */
  embedded?: boolean;
};

const STAGE_INSPECTOR_TABS: readonly {
  id: StageInspectorTab;
  label: string;
  Icon: typeof MonitorPlay;
}[] = [
  { id: "overview", label: "Overview", Icon: LayoutGrid },
  { id: "scene3d", label: "Scene3D", Icon: MonitorPlay },
  { id: "toolbar", label: "Toolbar", Icon: SlidersHorizontal },
];

function formatStudioEnvironmentLabel(studioAssetId: unknown): string {
  if (typeof studioAssetId !== "string" || studioAssetId.trim().length === 0) {
    return "Engine preset";
  }
  const parts = studioAssetId.trim().split(".");
  const tail = parts[parts.length - 1] ?? studioAssetId;
  if (tail.length === 0) {
    return studioAssetId;
  }
  return tail.charAt(0).toUpperCase() + tail.slice(1);
}

export function StageInspectorPanel(props: StageInspectorPanelProps) {
  const { stagePresentationPreferences, onStagePresentationPreferencesChange, embedded = false } =
    props;
  const snapshot = useStageSceneStore((s) => s.snapshot);
  const primaryModelIndex = useStageSceneStore((s) => s.primaryModelIndex);
  const flowNodes = useFlowEditorStore((s) => s.nodes);
  const flowEdges = useFlowEditorStore((s) => s.edges);
  const selectStudioNodesByIds = useFlowEditorStore((s) => s.selectStudioNodesByIds);
  const viewportMousePreset = useStageViewportNavigationStore((s) => s.mousePreset);
  const viewportViewSnapMode = useStageViewportNavigationStore((s) => s.viewSnapMode);
  const setViewportMousePreset = useStageViewportNavigationStore((s) => s.setMousePreset);
  const setViewportViewSnapMode = useStageViewportNavigationStore((s) => s.setViewSnapMode);

  const [activeTab, setActiveTab] = useState<StageInspectorTab>(() => readStoredStageInspectorTab());

  const setActiveTabPersisted = useCallback((next: StageInspectorTab) => {
    setActiveTab(next);
    writeStoredStageInspectorTab(next);
  }, []);

  const envWire = useMemo(
    () => getStageEnvironmentWireContext(),
    [flowNodes, flowEdges],
  );

  const focusedModel =
    snapshot.models.length > 0
      ? snapshot.models[Math.min(primaryModelIndex, snapshot.models.length - 1)]
      : null;

  const envLabel = formatStudioEnvironmentLabel(
    snapshot.environmentWire?.studioAssetId ?? snapshot.scene3d.environment.studioAssetId,
  );

  const showGrid = snapshot.showGrid;
  const outputId = snapshot.sceneOutputNodeId;

  const patchShowGrid = (next: boolean) => {
    if (outputId == null) {
      return;
    }
    useFlowEditorStore.setState((state) => ({
      nodes: state.nodes.map((n) => {
        if (n.id !== outputId || n.type !== "studio") {
          return n;
        }
        const dc = { ...(n.data.defaultConfig as Record<string, unknown>) };
        dc.showGrid = next;
        const base =
          dc.scene3d != null
            ? coerceScene3DConfigV1(dc.scene3d)
            : stageSceneOutputDefaultScene3d();
        dc.scene3d = persistScene3DConfig(
          applyStageScene3dPresentation(base, { showGrid: next }),
        );
        return { ...n, data: { ...n.data, defaultConfig: dc } };
      }),
    }));
    useFlowEditorStore.getState().tickSimulation({ forceStageSnapshot: true });
  };

  const focusSceneOutput = () => {
    if (outputId != null) {
      selectStudioNodesByIds([outputId]);
    }
  };

  const overviewTab = (
    <InspectorSettingsSectionFrame title="Committed scene">
      {outputId == null ? (
        <p className="text-[11px] leading-relaxed text-zinc-500">
          Add a <span className="text-zinc-400">Scene Output</span> node and wire models to preview
          here.
        </p>
      ) : (
        <div className="space-y-2.5">
          <div className="rounded-lg border border-zinc-700/60 bg-zinc-900/40 px-2.5 py-2 text-[11px] text-zinc-300">
            <div>
              Models:{" "}
              <span className="font-medium text-zinc-100">
                {snapshot.models.length === 0
                  ? "none wired"
                  : snapshot.models.length === 1
                    ? "1"
                    : `${snapshot.models.length} (focus ${primaryModelIndex + 1})`}
              </span>
            </div>
            {focusedModel != null ? (
              <div className="mt-0.5 truncate text-zinc-400">{focusedModel.label}</div>
            ) : null}
            <div className="mt-1">
              Environment: <span className="font-medium text-zinc-100">{envLabel}</span>
              {envWire.wired ? <span className="text-sky-300/90"> · wired node</span> : null}
            </div>
          </div>
          <InspectorCompactToggleRow
            label="Floor grid"
            hint="Scene Output scene3d grid; also on Stage toolbar."
            checked={showGrid}
            onCheckedChange={patchShowGrid}
            ariaLabel="Show floor grid on Stage"
          />
          <button
            type="button"
            className="w-full rounded-md border border-zinc-700/70 bg-zinc-900/50 px-2 py-1.5 text-[10px] font-medium text-zinc-300 transition-colors hover:bg-zinc-800/60"
            onClick={focusSceneOutput}
          >
            Select Scene Output on canvas
          </button>
          <div className="border-t border-zinc-800/60 pt-2.5">
            <StageMeshesOnlyScenePreferencesSection
              preferences={stagePresentationPreferences}
              onPreferencesChange={onStagePresentationPreferencesChange}
            />
          </div>
        </div>
      )}
    </InspectorSettingsSectionFrame>
  );

  const tabs = (
      <TRNTabs
        value={activeTab}
        onValueChange={(next) => setActiveTabPersisted(next as StageInspectorTab)}
        className="flex min-h-0 min-w-0 flex-1 flex-col"
        activeTriggerClassName={TRN_INSPECTOR_TAB_ACTIVE_CLASS}
      >
        <div className={TRN_INSPECTOR_TAB_BAR_WRAP_CLASS}>
          <TRNTabsList className={TRN_INSPECTOR_TAB_LIST_CLASS}>
            {STAGE_INSPECTOR_TABS.map(({ id, label, Icon }) => (
              <TRNTabsTrigger key={id} value={id} className={TRN_INSPECTOR_TAB_TRIGGER_CLASS}>
                <Icon className="h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />
                {label}
              </TRNTabsTrigger>
            ))}
          </TRNTabsList>
        </div>

        <div className={TRN_INSPECTOR_PANEL_BODY_COLUMN_CLASS}>
          <StageInspectorContextBar
            activeTab={activeTab}
            modelCount={snapshot.models.length}
            focusedModelLabel={focusedModel?.label ?? null}
            envLabel={envLabel}
            envWired={envWire.wired}
            showGrid={showGrid}
          />
          <div className={TRN_INSPECTOR_PANEL_SCROLL_CLASS}>
            {activeTab === "overview" ? <div className="space-y-2">{overviewTab}</div> : null}
            {activeTab === "scene3d" ? <StageInspectorScene3dTab /> : null}
            {activeTab === "toolbar" ? (
              <StageInspectorToolbarTab
                stagePresentationPreferences={stagePresentationPreferences}
                onStagePresentationPreferencesChange={onStagePresentationPreferencesChange}
                viewportMousePreset={viewportMousePreset}
                viewportViewSnapMode={viewportViewSnapMode}
                onViewportMousePresetChange={setViewportMousePreset}
                onViewportViewSnapModeChange={setViewportViewSnapMode}
              />
            ) : null}
          </div>
        </div>
      </TRNTabs>
  );

  if (embedded) {
    return <div className="flex min-h-0 min-w-0 flex-1 flex-col">{tabs}</div>;
  }

  return <div className={TRN_INSPECTOR_PANEL_SHELL_CLASS}>{tabs}</div>;
}
