import { useMemo, useState } from "react";
import { Clapperboard } from "lucide-react";
import { TRNButton, TRNHintText, TRNSegmentedControl } from "../../../../../ui/TRN";
import type { StudioGltfExtractRow } from "../../gltf/studio-gltf-extract";
import { ANIMATION_MERGE_MAX_INPUTS } from "../../nodes/animation/animation-merge-inputs";
import {
  GLB_ANIMATION_SETUP_COMBINER_OPTIONS,
  type GlbAnimationSetupCombinerMode,
} from "./glb-animation-setup-combiner";
import {
  readStoredGlbAnimationSetupCombinerMode,
  writeStoredGlbAnimationSetupCombinerMode,
} from "./glb-animation-setup-ui-persistence";

export type GlbAnimationSetupBuildArgs = {
  clipRefs: string[];
  combinerMode: GlbAnimationSetupCombinerMode;
};

export type GlbAnimationSetupPanelProps = {
  dense: boolean;
  borderColor: string;
  animations: StudioGltfExtractRow[];
  onBuildSetup: (args: GlbAnimationSetupBuildArgs) => void;
};

function defaultSelectedRefs(animations: StudioGltfExtractRow[]): Set<string> {
  const refs = animations.map((row) => row.ref.trim()).filter((ref) => ref.length > 0);
  const pick = refs.slice(0, Math.min(2, refs.length));
  return new Set(pick);
}

export function GlbAnimationSetupPanel(props: GlbAnimationSetupPanelProps) {
  const { dense, borderColor, animations, onBuildSetup } = props;
  const [selected, setSelected] = useState<Set<string>>(() => defaultSelectedRefs(animations));
  const [combinerMode, setCombinerMode] = useState<GlbAnimationSetupCombinerMode>(() =>
    readStoredGlbAnimationSetupCombinerMode(),
  );

  const setCombinerModePersisted = (next: GlbAnimationSetupCombinerMode) => {
    setCombinerMode(next);
    writeStoredGlbAnimationSetupCombinerMode(next);
  };

  const rows = useMemo(
    () => animations.filter((row) => row.ref.trim().length > 0),
    [animations],
  );

  const selectedList = useMemo(
    () => rows.map((row) => row.ref).filter((ref) => selected.has(ref)),
    [rows, selected],
  );

  const toggleRef = (ref: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(ref)) {
        next.delete(ref);
      } else if (next.size < ANIMATION_MERGE_MAX_INPUTS) {
        next.add(ref);
      }
      return next;
    });
  };

  if (rows.length === 0) {
    return null;
  }

  const canBuild = selectedList.length >= 1 && selectedList.length <= ANIMATION_MERGE_MAX_INPUTS;
  const combinerLabel = combinerMode === "mix" ? "Animation Mix" : "Animation Merge";
  const setupHint =
    selectedList.length === 1
      ? "Spawns **Animation Clip** → **Model Viewer**."
      : selectedList.length === 2
        ? "Spawns 2 **Animation Clip** nodes → **Animation Blend** → **Model Viewer**."
        : `Spawns ${selectedList.length} **Animation Clip** nodes → **${combinerLabel}** (${selectedList.length} inputs) → **Model Viewer**.`;

  return (
    <div
      className={`rounded border border-zinc-800/80 bg-zinc-950/45 ${
        dense ? "space-y-1.5 p-2" : "space-y-2 p-2.5"
      }`}
      style={{ borderColor }}
    >
      <div className="flex items-center gap-1.5">
        <Clapperboard className="h-3 w-3 shrink-0 text-emerald-400/90" aria-hidden />
        <span className={`font-medium text-zinc-200 ${dense ? "text-[10px]" : "text-[11px]"}`}>
          Build animation graph
        </span>
      </div>
      <TRNHintText tone="muted" className={dense ? "text-[9px] leading-snug" : "text-[10px] leading-snug"}>
        Pick up to {ANIMATION_MERGE_MAX_INPUTS} clips. {setupHint}
      </TRNHintText>
      {rows.length >= 3 ? (
        <div className="space-y-1">
          <span className={`font-medium text-zinc-400 ${dense ? "text-[9px]" : "text-[10px]"}`}>
            Combiner
          </span>
          <TRNSegmentedControl
            ariaLabel="Animation graph combiner"
            className="w-full"
            fullWidth
            size="sm"
            tone="neutral"
            variant="surface"
            value={combinerMode}
            options={GLB_ANIMATION_SETUP_COMBINER_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
            onValueChange={(value) => {
              if (value === "merge" || value === "mix") {
                setCombinerModePersisted(value);
              }
            }}
          />
          <TRNHintText tone="muted" className={dense ? "text-[9px] leading-snug" : "text-[10px] leading-snug"}>
            {GLB_ANIMATION_SETUP_COMBINER_OPTIONS.find((o) => o.value === combinerMode)?.hint}
          </TRNHintText>
        </div>
      ) : null}
      <ul className={dense ? "space-y-0.5" : "space-y-1"}>
        {rows.map((row) => {
          const checked = selected.has(row.ref);
          const disabled = !checked && selected.size >= ANIMATION_MERGE_MAX_INPUTS;
          return (
            <li key={row.ref}>
              <label
                className={`flex cursor-pointer items-center gap-2 rounded border border-transparent px-1 py-0.5 ${
                  disabled ? "cursor-not-allowed opacity-50" : "hover:border-zinc-700/60 hover:bg-zinc-900/50"
                } ${dense ? "text-[10px]" : "text-[11px]"}`}
              >
                <input
                  type="checkbox"
                  className="h-3 w-3 shrink-0 accent-emerald-500"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => {
                    toggleRef(row.ref);
                  }}
                />
                <span className="min-w-0 flex-1 truncate text-zinc-200">{row.label}</span>
              </label>
            </li>
          );
        })}
      </ul>
      <TRNButton
        size="compact"
        className="w-full justify-center border border-zinc-700/70 bg-zinc-900/80 text-[10px] text-zinc-100 hover:border-emerald-500/35 hover:bg-zinc-900"
        disabled={!canBuild}
        hint={canBuild ? setupHint : `Select 1–${ANIMATION_MERGE_MAX_INPUTS} clips to build the graph.`}
        onClick={() => {
          if (!canBuild) {
            return;
          }
          onBuildSetup({ clipRefs: selectedList, combinerMode });
        }}
      >
        Build graph ({selectedList.length})
      </TRNButton>
    </div>
  );
}
