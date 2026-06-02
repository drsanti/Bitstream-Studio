import { useEffect, useMemo } from "react";
import { Clapperboard } from "lucide-react";
import { TRNFormField, TRNHintText, TRNSelect, type TRNSelectOption } from "../../../../../../../ui/TRN";
import {
  readGlbAnimEventLoopMode,
  readGlbAnimEventSpeed,
  readGlbAnimEventWeight,
  readGlbAnimTriggerNonce,
} from "../../../../nodes/events/glb-anim-event-config";
import {
  readGlbExtractTag,
  resolveEventGlbActionModelRefForInspector,
  resolveStudioSourceModelGlbUrl,
  STUDIO_GLB_EXTRACT_KIND_KEY,
  STUDIO_GLB_EXTRACT_REF_KEY,
  STUDIO_SOURCE_MODEL_NODE_ID_KEY,
} from "../../../../model/model-generated-bindings";
import type { StudioGlbAnimationLoopModeV1 } from "../../../../nodes/animation/flow-wire-animation";
import { useStudioGltfExtraction } from "../../../../gltf/useStudioGltfExtraction";
import { useFlowEditorStore } from "../../../../store/flow-editor.store";
import { InspectorCollapsibleSection } from "../../InspectorCollapsibleSection";
import { InspectorNumericField } from "../../InspectorNumericScrubRow";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";

const LOOP_OPTIONS: TRNSelectOption[] = [
  { value: "once", label: "Once (one-shot)" },
  { value: "loop", label: "Loop" },
  { value: "pingpong", label: "Ping-pong" },
];

const GLB_CLIP_UNBOUND = "__unbound__";

function buildGlbAnimClipBindingPatch(
  ref: string,
  modelFlowId: string | undefined,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {
    [STUDIO_GLB_EXTRACT_KIND_KEY]: "animation",
    [STUDIO_GLB_EXTRACT_REF_KEY]: ref.trim(),
  };
  if (modelFlowId != null && modelFlowId.trim().length > 0) {
    patch[STUDIO_SOURCE_MODEL_NODE_ID_KEY] = modelFlowId;
  }
  return patch;
}

function GlbAnimBindHint(props: {
  defaultConfig: Record<string, unknown>;
  triggerNonce: number;
  clipOptions: TRNSelectOption[];
  onPickClip: (ref: string) => void;
}) {
  const glbTag = readGlbExtractTag(props.defaultConfig);
  const boundRef = glbTag?.kind === "animation" ? glbTag.ref : "";
  const isBound = boundRef.length > 0;

  const selectOptions: TRNSelectOption[] = useMemo(() => {
    if (props.clipOptions.length === 0) {
      return [];
    }
    if (isBound) {
      return props.clipOptions;
    }
    return [{ value: GLB_CLIP_UNBOUND, label: "Select clip…" }, ...props.clipOptions];
  }, [isBound, props.clipOptions]);

  const selectValue = useMemo(() => {
    if (isBound && props.clipOptions.some((o) => o.value === boundRef)) {
      return boundRef;
    }
    if (isBound && boundRef.length > 0) {
      return boundRef;
    }
    return GLB_CLIP_UNBOUND;
  }, [boundRef, isBound, props.clipOptions]);

  return (
    <div className="nodrag space-y-2">
      {isBound ? (
        <div className="rounded border border-cyan-900/45 bg-cyan-950/20 px-2 py-1.5">
          <div className="text-[11px] font-medium text-cyan-100/95">GLB animation binding</div>
          <div className="mt-1 break-all font-mono text-[10px] leading-snug text-zinc-400">
            <span className="uppercase text-cyan-300/80">animation</span>
            <span className="mx-1 text-zinc-600">·</span>
            <span>{boundRef}</span>
          </div>
          {props.clipOptions.length > 0 &&
          !props.clipOptions.some((o) => o.value === boundRef) ? (
            <div className="mt-1.5 text-[10px] leading-snug text-amber-200/90">
              This clip is not on the linked GLB — pick a clip below.
            </div>
          ) : null}
        </div>
      ) : props.triggerNonce > 0 ? (
        <div className="rounded border border-amber-900/55 bg-amber-950/30 px-2 py-1.5 text-[10px] leading-snug text-amber-100/95">
          **{props.triggerNonce}** event pulses received but **no clip is bound** — choose a clip
          below (or Library **GLB → Animations → Evt**).
        </div>
      ) : (
        <TRNHintText tone="muted" className="text-[10px] leading-snug">
          Pick a clip below or spawn from Library **GLB → Animations** (**Evt**) with **Studio Model**
          selected.
        </TRNHintText>
      )}
      {selectOptions.length > 0 ? (
        <TRNFormField label="GLB clip" id="event-trigger-glb-anim-clip" className="space-y-1.5">
          <TRNSelect
            ariaLabel="GLB animation clip to trigger"
            value={selectValue}
            options={
              isBound && !props.clipOptions.some((o) => o.value === boundRef)
                ? [{ value: boundRef, label: boundRef }, ...selectOptions]
                : selectOptions
            }
            size="sm"
            className="min-w-0"
            buttonClassName="min-h-7 text-[10px]"
            panelClassName="scrollbar-hide max-h-48 overflow-y-auto"
            onValueChange={(next) => {
              if (next === GLB_CLIP_UNBOUND || next.trim().length === 0) {
                return;
              }
              props.onPickClip(next);
            }}
          />
        </TRNFormField>
      ) : (
        <TRNHintText tone="muted" className="text-[10px] leading-snug">
          Wire **Studio Model → Model** on this node (or link via **Model viewer**) so this panel can
          list animation clips from the GLB.
        </TRNHintText>
      )}
    </div>
  );
}

export function EventTriggerGlbAnimSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode } = props;
  const flowNodeId = selectedNode.id;
  const dc = useFlowEditorStore((s) => {
    const live = s.nodes.find((n) => n.id === flowNodeId);
    return (live?.data.defaultConfig ?? selectedNode.data.defaultConfig) as Record<string, unknown>;
  });
  const loopMode = readGlbAnimEventLoopMode(dc);
  const speed = readGlbAnimEventSpeed(dc);
  const weight = readGlbAnimEventWeight(dc);
  const triggerNonce = readGlbAnimTriggerNonce(dc);

  const nodes = useFlowEditorStore((s) => s.nodes);
  const edges = useFlowEditorStore((s) => s.edges);
  const patchSelectedNodeConfigFields = useFlowEditorStore((s) => s.patchSelectedNodeConfigFields);

  const modelRef = useMemo(
    () => resolveEventGlbActionModelRefForInspector(nodes, edges, selectedNode.id),
    [nodes, edges, selectedNode.id],
  );

  const glbUrl = useMemo(() => {
    if (modelRef.status !== "ok") {
      return null;
    }
    return resolveStudioSourceModelGlbUrl(nodes, modelRef.modelFlowId);
  }, [modelRef, nodes]);

  const extraction = useStudioGltfExtraction(glbUrl);

  const clipOptions = useMemo((): TRNSelectOption[] => {
    if (extraction.state !== "ok") {
      return [];
    }
    return extraction.result.animations.map((row) => ({
      value: row.ref,
      label: row.durationS > 0 ? `${row.label} (${row.durationS.toFixed(2)}s)` : row.label,
    }));
  }, [extraction.result, extraction.state]);

  const bindClip = (ref: string) => {
    const modelFlowId = modelRef.status === "ok" ? modelRef.modelFlowId : undefined;
    patchSelectedNodeConfigFields(buildGlbAnimClipBindingPatch(ref, modelFlowId));
  };

  const glbExtractTag = readGlbExtractTag(dc);

  /** Drop clip bindings that no longer exist on the scoped GLB (e.g. after re-wiring Model). */
  useEffect(() => {
    if (modelRef.status !== "ok") {
      return;
    }
    const tag = readGlbExtractTag(dc);
    if (tag?.kind !== "animation") {
      return;
    }
    if (extraction.state !== "ok") {
      return;
    }
    if (clipOptions.some((o) => o.value === tag.ref)) {
      return;
    }
    if (clipOptions.length === 1) {
      patchSelectedNodeConfigFields(
        buildGlbAnimClipBindingPatch(clipOptions[0]!.value, modelRef.modelFlowId),
      );
      return;
    }
    patchSelectedNodeConfigFields({
      [STUDIO_GLB_EXTRACT_KIND_KEY]: undefined,
      [STUDIO_GLB_EXTRACT_REF_KEY]: undefined,
      [STUDIO_SOURCE_MODEL_NODE_ID_KEY]: modelRef.modelFlowId,
    });
  }, [
    modelRef,
    extraction.state,
    clipOptions,
    dc,
    flowNodeId,
    patchSelectedNodeConfigFields,
  ]);

  /** Single-clip GLBs: bind automatically so triggers work without an extra picker step. */
  useEffect(() => {
    if (glbExtractTag?.kind === "animation") {
      return;
    }
    if (clipOptions.length !== 1) {
      return;
    }
    const ref = clipOptions[0]!.value.trim();
    if (ref.length === 0) {
      return;
    }
    const modelFlowId = modelRef.status === "ok" ? modelRef.modelFlowId : undefined;
    patchSelectedNodeConfigFields(buildGlbAnimClipBindingPatch(ref, modelFlowId));
  }, [
    selectedNode.id,
    glbExtractTag?.kind,
    glbExtractTag?.ref,
    clipOptions,
    modelRef,
    patchSelectedNodeConfigFields,
  ]);

  return (
    <InspectorCollapsibleSection
      title="Trigger GLB animation"
      icon={<Clapperboard className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
      iconHint="Each event pulse increments an internal counter and restarts the bound clip in the Model viewer preview."
      defaultExpanded
    >
      <GlbAnimBindHint
        defaultConfig={dc}
        triggerNonce={triggerNonce}
        clipOptions={clipOptions}
        onPickClip={bindClip}
      />
      {extraction.state === "loading" ? (
        <TRNHintText tone="muted" className="text-[10px]">
          Loading GLB clip list…
        </TRNHintText>
      ) : null}
      {extraction.state === "ok" && extraction.result.animations.length === 0 ? (
        <TRNHintText tone="muted" className="text-[10px] leading-snug text-amber-200/90">
          This GLB has **no named animation clips**. Use a model with clips or drive morphs / parts
          instead.
        </TRNHintText>
      ) : null}
      <TRNHintText className="text-[10px]">
        Triggers fired: **{triggerNonce}**. Drives the **Model viewer** wired to the same **Studio
        Model** (wire **Model** on this node or on the viewer).
      </TRNHintText>
      <TRNFormField label="Loop mode" id="event-trigger-glb-anim-loop" className="space-y-1.5">
        <TRNSelect
          ariaLabel="Animation loop mode on trigger"
          value={loopMode}
          options={LOOP_OPTIONS}
          size="sm"
          className="min-w-0"
          buttonClassName="min-h-7 text-[10px]"
          panelClassName="scrollbar-hide max-h-48 overflow-y-auto"
          onValueChange={(next) => {
            props.onUpdateConfigField("loopMode", next as StudioGlbAnimationLoopModeV1);
          }}
        />
      </TRNFormField>
      <div className="grid grid-cols-2 gap-2">
        <TRNFormField label="Speed" id="event-trigger-glb-anim-speed" className="space-y-1">
          <InspectorNumericField
            ariaLabel="GLB animation speed"
            value={speed}
            step={0.1}
            onCommit={(n) => {
              props.onUpdateConfigField("speed", n);
            }}
          />
        </TRNFormField>
        <TRNFormField label="Weight" id="event-trigger-glb-anim-weight" className="space-y-1">
          <InspectorNumericField
            ariaLabel="GLB animation weight"
            value={weight}
            min={0}
            max={1}
            step={0.05}
            onCommit={(n) => {
              props.onUpdateConfigField("weight", Math.min(1, Math.max(0, n)));
            }}
          />
        </TRNFormField>
      </div>
    </InspectorCollapsibleSection>
  );
}
