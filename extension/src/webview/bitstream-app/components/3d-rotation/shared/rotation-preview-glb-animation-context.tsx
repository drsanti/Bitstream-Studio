import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { GlbPreviewUserTransport } from "../../../../sensor-studio/features/editor/gltf/glb-preview-user-transport";

export type RotationPreviewGlbRuntimeReport = {
  gltfClipCount: number;
  clipNames: string[];
  boundActionCount: number;
};

export type RotationPreviewGlbAnimationContextValue = {
  fetchUrl: string;
  modelLabel: string;
  dedupeKey: string;
  hasAnimations: boolean;
  setHasAnimations: Dispatch<SetStateAction<boolean>>;
  transport: GlbPreviewUserTransport;
  setTransport: Dispatch<SetStateAction<GlbPreviewUserTransport>>;
  flowOwnsPlayback: boolean;
  runtime: RotationPreviewGlbRuntimeReport;
  setRuntimeReport: (report: RotationPreviewGlbRuntimeReport) => void;
};

const EMPTY_RUNTIME: RotationPreviewGlbRuntimeReport = {
  gltfClipCount: 0,
  clipNames: [],
  boundActionCount: 0,
};

const RotationPreviewGlbAnimationContext =
  createContext<RotationPreviewGlbAnimationContextValue | null>(null);

export function RotationPreviewGlbAnimationProvider(props: {
  children: ReactNode;
  fetchUrl: string;
  modelLabel: string;
  dedupeKey: string;
  flowOwnsPlayback?: boolean;
}) {
  const [hasAnimations, setHasAnimations] = useState(false);
  const [transport, setTransport] = useState<GlbPreviewUserTransport>("stopped");
  const [runtime, setRuntime] = useState<RotationPreviewGlbRuntimeReport>(EMPTY_RUNTIME);

  useEffect(() => {
    setHasAnimations(false);
    setTransport("stopped");
    setRuntime(EMPTY_RUNTIME);
  }, [props.fetchUrl]);

  const setRuntimeReport = useCallback((report: RotationPreviewGlbRuntimeReport) => {
    setRuntime(report);
    setHasAnimations(report.boundActionCount > 0);
  }, []);

  const value = useMemo(
    (): RotationPreviewGlbAnimationContextValue => ({
      fetchUrl: props.fetchUrl,
      modelLabel: props.modelLabel,
      dedupeKey: props.dedupeKey,
      hasAnimations,
      setHasAnimations,
      transport,
      setTransport,
      flowOwnsPlayback: props.flowOwnsPlayback ?? false,
      runtime,
      setRuntimeReport,
    }),
    [
      hasAnimations,
      props.dedupeKey,
      props.fetchUrl,
      props.flowOwnsPlayback,
      props.modelLabel,
      runtime,
      setRuntimeReport,
      transport,
    ],
  );

  return (
    <RotationPreviewGlbAnimationContext.Provider value={value}>
      {props.children}
    </RotationPreviewGlbAnimationContext.Provider>
  );
}

export function useRotationPreviewGlbAnimation(): RotationPreviewGlbAnimationContextValue | null {
  return useContext(RotationPreviewGlbAnimationContext);
}
