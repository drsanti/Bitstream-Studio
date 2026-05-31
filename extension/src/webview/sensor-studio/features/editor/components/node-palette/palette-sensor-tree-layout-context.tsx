import { createContext, useContext, type ReactElement, type ReactNode } from "react";
import type { SensorFamilyTreeLayout } from "./sensor-family-tree-layout";

const PaletteSensorTreeLayoutContext = createContext<SensorFamilyTreeLayout>("classic");

export function PaletteSensorTreeLayoutProvider(props: {
  value: SensorFamilyTreeLayout;
  children: ReactNode;
}): ReactElement {
  return (
    <PaletteSensorTreeLayoutContext.Provider value={props.value}>
      {props.children}
    </PaletteSensorTreeLayoutContext.Provider>
  );
}

export function usePaletteSensorTreeLayout(): SensorFamilyTreeLayout {
  return useContext(PaletteSensorTreeLayoutContext);
}
