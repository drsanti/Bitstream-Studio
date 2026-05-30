import { createContext, useContext } from "react";
import type { ReactNode } from "react";

const PaletteLiveTickContext = createContext(0);

/** Re-renders palette rows periodically so live previews can animate values. */
export function PaletteLiveTickProvider(props: { children: ReactNode }) {
  return <PaletteLiveTickContext.Provider value={0}>{props.children}</PaletteLiveTickContext.Provider>;
}

export function usePaletteLiveTick(): number {
  return useContext(PaletteLiveTickContext);
}
