import { createContext, useContext, type ReactNode } from "react";
import {
  DEFAULT_FLOW_CANVAS_PREFERENCES,
  type FlowCanvasPreferences,
} from "../../../persistence/flow-canvas-preferences";

const FlowCanvasPreferencesContext = createContext<FlowCanvasPreferences>(
  DEFAULT_FLOW_CANVAS_PREFERENCES,
);

export function FlowCanvasPreferencesProvider(props: {
  value: FlowCanvasPreferences;
  children: ReactNode;
}) {
  return (
    <FlowCanvasPreferencesContext.Provider value={props.value}>
      {props.children}
    </FlowCanvasPreferencesContext.Provider>
  );
}

export function useFlowCanvasPreferences(): FlowCanvasPreferences {
  return useContext(FlowCanvasPreferencesContext);
}
