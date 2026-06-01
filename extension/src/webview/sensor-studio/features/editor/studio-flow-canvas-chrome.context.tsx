import { createContext, useContext, type ReactNode } from "react";
import type { StudioOverflowMenuProps } from "./components/StudioOverflowMenu";

const StudioFlowCanvasChromeContext = createContext<StudioOverflowMenuProps | null>(null);

export function StudioFlowCanvasChromeProvider(props: {
  value: StudioOverflowMenuProps;
  children: ReactNode;
}) {
  const { value, children } = props;
  return (
    <StudioFlowCanvasChromeContext.Provider value={value}>
      {children}
    </StudioFlowCanvasChromeContext.Provider>
  );
}

export function useStudioFlowCanvasChrome(): StudioOverflowMenuProps | null {
  return useContext(StudioFlowCanvasChromeContext);
}
