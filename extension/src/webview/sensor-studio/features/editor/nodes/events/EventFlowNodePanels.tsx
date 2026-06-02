import { useMemo } from "react";
import { TRNToggleSwitch } from "../../../../../ui/TRN";
import { useFlowEditorStore } from "../../store/flow-editor.store";
import {
  readEventBooleanValue,
  readEventSetBooleanTarget,
} from "../../../../core/flow/flow-event-runner";
import { ReadingPanel } from "../flow-node/readings/ReadingPanel";
import { formatOnKeyLabel, readOnKeyConfig } from "./on-key-config";
import { formatOnClickButtonLabel, readOnClickConfig } from "./on-click-config";
import {
  formatGlbPartVisibilityLabel,
  readGlbPartSetVisibleTarget,
  readGlbPartVisibilityScalar,
} from "./glb-part-event-config";
import {
  readGlbAnimEventLoopMode,
  readGlbAnimTriggerNonce,
} from "./glb-anim-event-config";
import { readGlbExtractTag } from "../../model/model-generated-bindings";

export type OnKeyNodePanelProps = {
  defaultConfig: Record<string, unknown>;
  lastFiredAtMs?: number;
};

function useEventPulseClass(lastFiredAtMs?: number): string {
  const pulsing =
    lastFiredAtMs != null && Number.isFinite(lastFiredAtMs) && Date.now() - lastFiredAtMs < 350;
  return pulsing
    ? "border-amber-400/60 bg-amber-950/40 text-amber-100"
    : "border-zinc-700/80 bg-zinc-950/45 text-zinc-200";
}

export function OnKeyNodePanel(props: OnKeyNodePanelProps) {
  const { defaultConfig, lastFiredAtMs } = props;
  const { key } = readOnKeyConfig(defaultConfig);
  const label = formatOnKeyLabel(key);
  const pulseClass = useEventPulseClass(lastFiredAtMs);

  return (
    <ReadingPanel className="flex items-center justify-between gap-2 text-xs">
      <span className="text-zinc-400">Key</span>
      <span className={`rounded border px-2 py-0.5 font-mono text-[11px] transition-colors ${pulseClass}`}>
        {label}
      </span>
    </ReadingPanel>
  );
}

export type OnClickNodePanelProps = {
  defaultConfig: Record<string, unknown>;
  lastFiredAtMs?: number;
};

export function OnClickNodePanel(props: OnClickNodePanelProps) {
  const { defaultConfig, lastFiredAtMs } = props;
  const { button } = readOnClickConfig(defaultConfig);
  const pulseClass = useEventPulseClass(lastFiredAtMs);

  return (
    <ReadingPanel className="flex items-center justify-between gap-2 text-xs">
      <span className="text-zinc-400">Click</span>
      <span className={`rounded border px-2 py-0.5 text-[10px] transition-colors ${pulseClass}`}>
        {formatOnClickButtonLabel(button)}
      </span>
    </ReadingPanel>
  );
}

export type EventToggleBooleanNodePanelProps = {
  nodeId: string;
  defaultConfig: Record<string, unknown>;
};

export function EventToggleBooleanNodePanel(props: EventToggleBooleanNodePanelProps) {
  const { nodeId, defaultConfig } = props;
  const updateField = useFlowEditorStore((s) => s.updateNodeConfigFieldByNodeId);
  const value = useMemo(() => readEventBooleanValue(defaultConfig), [defaultConfig]);

  return (
    <ReadingPanel className="space-y-2">
      <div className="flex items-center justify-between rounded border border-zinc-700/80 bg-transparent px-2 py-1">
        <span className="text-xs font-medium text-zinc-200">Out</span>
        <TRNToggleSwitch
          checked={value}
          ariaLabel="Toggle boolean output"
          onCheckedChange={(checked) => {
            updateField(nodeId, "value", checked);
          }}
        />
      </div>
      <p className="text-[10px] leading-snug text-zinc-500">
        Flips on each incoming **event** pulse. Manual toggle sets the starting value.
      </p>
    </ReadingPanel>
  );
}

export type EventSetBooleanNodePanelProps = {
  nodeId: string;
  defaultConfig: Record<string, unknown>;
};

export function EventSetBooleanNodePanel(props: EventSetBooleanNodePanelProps) {
  const { nodeId, defaultConfig } = props;
  const updateField = useFlowEditorStore((s) => s.updateNodeConfigFieldByNodeId);
  const value = useMemo(() => readEventBooleanValue(defaultConfig), [defaultConfig]);
  const setTo = useMemo(() => readEventSetBooleanTarget(defaultConfig), [defaultConfig]);

  return (
    <ReadingPanel className="space-y-2">
      <div className="flex items-center justify-between rounded border border-zinc-700/80 bg-transparent px-2 py-1">
        <span className="text-xs font-medium text-zinc-200">Out</span>
        <TRNToggleSwitch
          checked={value}
          ariaLabel="Boolean output value"
          onCheckedChange={(checked) => {
            updateField(nodeId, "value", checked);
          }}
        />
      </div>
      <p className="text-[10px] leading-snug text-zinc-500">
        Sets to {setTo ? "ON" : "OFF"} on each **event** pulse (see Node tab).
      </p>
    </ReadingPanel>
  );
}

export type EventToggleGlbPartNodePanelProps = {
  nodeId: string;
  defaultConfig: Record<string, unknown>;
};

export function EventToggleGlbPartNodePanel(props: EventToggleGlbPartNodePanelProps) {
  const { nodeId, defaultConfig } = props;
  const updateField = useFlowEditorStore((s) => s.updateNodeConfigFieldByNodeId);
  const visible = useMemo(() => readGlbPartVisibilityScalar(defaultConfig) > 0.5, [defaultConfig]);
  const glbTag = readGlbExtractTag(defaultConfig);

  return (
    <ReadingPanel className="space-y-2">
      <div className="flex items-center justify-between rounded border border-zinc-700/80 bg-transparent px-2 py-1">
        <span className="text-xs font-medium text-zinc-200">Part</span>
        <TRNToggleSwitch
          checked={visible}
          ariaLabel="GLB part visibility"
          onCheckedChange={(checked) => {
            updateField(nodeId, "value", checked ? 1 : 0);
          }}
        />
      </div>
      {glbTag != null ? (
        <p className="truncate font-mono text-[10px] text-zinc-500" title={glbTag.ref}>
          {glbTag.ref}
        </p>
      ) : null}
      <p className="text-[10px] leading-snug text-zinc-500">
        Flips to {visible ? "hidden" : "visible"} on each **event** pulse. Now:{" "}
        {formatGlbPartVisibilityLabel(readGlbPartVisibilityScalar(defaultConfig))}.
      </p>
    </ReadingPanel>
  );
}

export type EventSetGlbPartNodePanelProps = {
  nodeId: string;
  defaultConfig: Record<string, unknown>;
};

export function EventSetGlbPartNodePanel(props: EventSetGlbPartNodePanelProps) {
  const { nodeId, defaultConfig } = props;
  const updateField = useFlowEditorStore((s) => s.updateNodeConfigFieldByNodeId);
  const visible = useMemo(() => readGlbPartVisibilityScalar(defaultConfig) > 0.5, [defaultConfig]);
  const setTo = useMemo(() => readGlbPartSetVisibleTarget(defaultConfig) > 0.5, [defaultConfig]);
  const glbTag = readGlbExtractTag(defaultConfig);

  return (
    <ReadingPanel className="space-y-2">
      <div className="flex items-center justify-between rounded border border-zinc-700/80 bg-transparent px-2 py-1">
        <span className="text-xs font-medium text-zinc-200">Part</span>
        <TRNToggleSwitch
          checked={visible}
          ariaLabel="GLB part visibility value"
          onCheckedChange={(checked) => {
            updateField(nodeId, "value", checked ? 1 : 0);
          }}
        />
      </div>
      {glbTag != null ? (
        <p className="truncate font-mono text-[10px] text-zinc-500" title={glbTag.ref}>
          {glbTag.ref}
        </p>
      ) : null}
      <p className="text-[10px] leading-snug text-zinc-500">
        Sets to {setTo ? "visible" : "hidden"} on each **event** pulse (see Node tab).
      </p>
    </ReadingPanel>
  );
}

export type EventTriggerGlbAnimNodePanelProps = {
  defaultConfig: Record<string, unknown>;
};

export function EventTriggerGlbAnimNodePanel(props: EventTriggerGlbAnimNodePanelProps) {
  const { defaultConfig } = props;
  const glbTag = readGlbExtractTag(defaultConfig);
  const bound = glbTag != null && glbTag.kind === "animation";
  const triggerNonce = useMemo(() => readGlbAnimTriggerNonce(defaultConfig), [defaultConfig]);
  const loopMode = useMemo(() => readGlbAnimEventLoopMode(defaultConfig), [defaultConfig]);

  return (
    <ReadingPanel className="space-y-2">
      <div className="flex items-center justify-between rounded border border-zinc-700/80 bg-transparent px-2 py-1">
        <span className="text-xs font-medium text-zinc-200">Clip</span>
        <span className="font-mono text-[10px] text-zinc-300">
          ×{triggerNonce}
        </span>
      </div>
      {bound ? (
        <p className="truncate font-mono text-[10px] text-cyan-300/90" title={glbTag.ref}>
          {glbTag.ref}
        </p>
      ) : (
        <p className="text-[10px] leading-snug text-amber-300/95">
          No clip bound — pick one on the **Node** tab (or **GLB → Animations → Evt**).
        </p>
      )}
      <p className="text-[10px] leading-snug text-zinc-500">
        {bound
          ? `Restarts **${glbTag.ref}** on each **event** pulse (${loopMode}).`
          : `Events are firing (×${triggerNonce}) but the preview has no clip to play.`}
      </p>
    </ReadingPanel>
  );
}
