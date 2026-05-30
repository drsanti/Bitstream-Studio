import { createContext, useContext, type ReactElement, type ReactNode } from "react";
import type { NodePaletteDensity } from "./node-palette-ui-persistence";

const PaletteDensityContext = createContext<NodePaletteDensity>("dense");

export function PaletteDensityProvider(props: {
  value: NodePaletteDensity;
  children: ReactNode;
}): ReactElement {
  return (
    <PaletteDensityContext.Provider value={props.value}>
      {props.children}
    </PaletteDensityContext.Provider>
  );
}

export function usePaletteDensity(): NodePaletteDensity {
  return useContext(PaletteDensityContext);
}
