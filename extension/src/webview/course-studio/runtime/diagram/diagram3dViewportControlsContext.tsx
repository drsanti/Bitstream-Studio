import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

type Diagram3dViewportControlsContextValue = {
  registerOrbitControls: (controls: OrbitControlsImpl | null) => void;
  setOrbitEnabled: (enabled: boolean) => void;
};

const Diagram3dViewportControlsContext =
  createContext<Diagram3dViewportControlsContextValue | null>(null);

export function Diagram3dViewportControlsProvider({ children }: { children: ReactNode }) {
  const orbitRef = useRef<OrbitControlsImpl | null>(null);

  const registerOrbitControls = useCallback((controls: OrbitControlsImpl | null) => {
    orbitRef.current = controls;
  }, []);

  const setOrbitEnabled = useCallback((enabled: boolean) => {
    if (orbitRef.current != null) {
      orbitRef.current.enabled = enabled;
    }
  }, []);

  const value = useMemo(
    () => ({ registerOrbitControls, setOrbitEnabled }),
    [registerOrbitControls, setOrbitEnabled],
  );

  return (
    <Diagram3dViewportControlsContext.Provider value={value}>
      {children}
    </Diagram3dViewportControlsContext.Provider>
  );
}

export function useDiagram3dViewportControls(): Diagram3dViewportControlsContextValue | null {
  return useContext(Diagram3dViewportControlsContext);
}
