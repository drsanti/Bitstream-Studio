import { useEffect, useMemo, useState } from "react";
import { TRNHighlightedJsonTextarea } from "../../../../../../ui/TRN";
import {
  coerceScene3DConfigV1,
  persistScene3DConfig,
  type Scene3DConfigV1,
} from "../../../../../core/scene3d/scene3d-config";
import { CanvasInspectorCard } from "../CanvasInspectorCard";
import { shouldShowScene3dJsonEditor } from "./scene3d-inspector-advanced-search";

export type Scene3dInspectorJsonSectionProps = {
  scene3dRaw: unknown;
  onChangeScene3d: (next: Scene3DConfigV1) => void;
  settingsSearch?: string;
};

export function Scene3dInspectorJsonSection(props: Scene3dInspectorJsonSectionProps) {
  const { scene3dRaw, onChangeScene3d, settingsSearch } = props;

  const canonical = useMemo(
    () => persistScene3DConfig(coerceScene3DConfigV1(scene3dRaw ?? {})),
    [scene3dRaw],
  );

  const canonicalJson = useMemo(() => JSON.stringify(canonical, null, 2), [canonical]);

  const [draft, setDraft] = useState(canonicalJson);
  const [error, setError] = useState<string | null>(null);
  const searchActive = (settingsSearch ?? "").trim().length > 0;
  const forceOpen = searchActive && shouldShowScene3dJsonEditor(settingsSearch ?? "");
  const [collapsed, setCollapsed] = useState(() => !forceOpen);

  useEffect(() => {
    setDraft(canonicalJson);
    setError(null);
  }, [canonicalJson]);

  useEffect(() => {
    if (forceOpen) {
      setCollapsed(false);
    }
  }, [forceOpen]);

  const commitDraft = () => {
    if (draft.trim() === canonicalJson.trim()) {
      setError(null);
      return;
    }
    try {
      const parsed: unknown = JSON.parse(draft);
      const next = persistScene3DConfig(coerceScene3DConfigV1(parsed));
      onChangeScene3d(next);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON");
    }
  };

  return (
    <CanvasInspectorCard
      id="scene3d-inspector-json"
      title="Scene JSON"
      hint="Coerced Scene3DConfigV1 — legacy keys upgrade on save via persistScene3DConfig."
      collapsible
      collapsed={collapsed}
      onCollapsedChange={setCollapsed}
    >
      <div className="space-y-1 px-0.5 pb-0.5 pt-0">
        {error != null ? (
          <p className="text-[10px] text-rose-400/95" role="alert">
            {error}
          </p>
        ) : null}
        <TRNHighlightedJsonTextarea
          aria-label="Scene3D configuration JSON"
          className="min-h-[140px] w-full max-h-[min(36vh,320px)]"
          value={draft}
          onChange={setDraft}
          onBlur={commitDraft}
        />
      </div>
    </CanvasInspectorCard>
  );
}
