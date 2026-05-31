import { Eye } from "lucide-react";
import { TRNFormField, TRNHintText, TRNToggleSwitch } from "../../../../../../../ui/TRN";
import {
  formatGlbPartVisibilityLabel,
  readGlbPartSetVisibleTarget,
  readGlbPartVisibilityScalar,
} from "../../../../nodes/events/glb-part-event-config";
import { readGlbExtractTag } from "../../../../model/model-generated-bindings";
import { InspectorCollapsibleSection } from "../../InspectorCollapsibleSection";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";

function GlbPartBindHint(props: { defaultConfig: Record<string, unknown> }) {
  const glbTag = readGlbExtractTag(props.defaultConfig);
  if (glbTag == null || glbTag.kind !== "part") {
    return (
      <TRNHintText tone="muted" className="text-[10px] leading-snug">
        Spawn from Library **GLB → Parts** (**Evt** button) with a Model selected, or add GLB metadata
        manually. Only **part** visibility is supported for event actions in v0.1.
      </TRNHintText>
    );
  }
  return (
    <div className="nodrag rounded border border-cyan-900/45 bg-cyan-950/20 px-2 py-1.5">
      <div className="text-[11px] font-medium text-cyan-100/95">GLB part binding</div>
      <div className="mt-1 break-all font-mono text-[10px] leading-snug text-zinc-400">
        <span className="uppercase text-cyan-300/80">{glbTag.kind}</span>
        <span className="mx-1 text-zinc-600">·</span>
        <span>{glbTag.ref}</span>
      </div>
      <TRNHintText tone="muted" className="mt-1 text-[10px] leading-snug">
        Values &gt; 0.5 show the part in a linked **Model viewer** on the same Model; ≤ 0.5 hides it.
      </TRNHintText>
    </div>
  );
}

export function EventToggleGlbPartSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const dc = props.selectedNode.data.defaultConfig as Record<string, unknown>;
  const visible = readGlbPartVisibilityScalar(dc) > 0.5;

  return (
    <InspectorCollapsibleSection
      title="Toggle GLB part"
      icon={<Eye className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
      iconHint="Each event pulse flips part visibility between hidden and visible."
      defaultExpanded
    >
      <GlbPartBindHint defaultConfig={dc} />
      <TRNHintText className="text-[10px]">
        Current state: **{formatGlbPartVisibilityLabel(readGlbPartVisibilityScalar(dc))}**. Manual toggle on
        the node card sets the starting visibility before the first pulse.
      </TRNHintText>
      <TRNFormField label="Starting visibility" id="event-toggle-glb-part-value" className="space-y-1.5">
        <div className="flex items-center justify-between rounded border border-zinc-700/80 bg-zinc-950/45 px-2.5 py-2">
          <span className="text-[11px] text-zinc-300">{visible ? "Visible" : "Hidden"}</span>
          <TRNToggleSwitch
            checked={visible}
            ariaLabel="GLB part starting visibility"
            onCheckedChange={(next) => {
              props.onUpdateConfigField("value", next ? 1 : 0);
            }}
          />
        </div>
      </TRNFormField>
    </InspectorCollapsibleSection>
  );
}

export function EventSetGlbPartSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const dc = props.selectedNode.data.defaultConfig as Record<string, unknown>;
  const setTo = readGlbPartSetVisibleTarget(dc) > 0.5;
  const current = readGlbPartVisibilityScalar(dc) > 0.5;

  return (
    <InspectorCollapsibleSection
      title="Set GLB part"
      icon={<Eye className="h-3.5 w-3.5 text-zinc-400" aria-hidden />}
      iconHint="Each event pulse writes the configured visible/hidden state (does not flip)."
      defaultExpanded
    >
      <GlbPartBindHint defaultConfig={dc} />
      <TRNFormField label="Set visibility on trigger" id="event-set-glb-part-set-to" className="space-y-1.5">
        <div className="flex items-center justify-between rounded border border-zinc-700/80 bg-zinc-950/45 px-2.5 py-2">
          <span className="text-[11px] text-zinc-300">{setTo ? "Visible" : "Hidden"}</span>
          <TRNToggleSwitch
            checked={setTo}
            ariaLabel="GLB part visibility applied on each event pulse"
            onCheckedChange={(next) => {
              props.onUpdateConfigField("setTo", next ? 1 : 0);
            }}
          />
        </div>
      </TRNFormField>
      <TRNHintText className="text-[10px]">
        Current part state: **{current ? "Visible" : "Hidden"}**. Manual toggle on the node card sets the
        latched value before the first pulse.
      </TRNHintText>
    </InspectorCollapsibleSection>
  );
}
