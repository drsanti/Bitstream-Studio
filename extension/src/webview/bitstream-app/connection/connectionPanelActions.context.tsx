import { createContext, useContext, type ReactNode } from "react";

export type ConnectionPanelActions = {
  connectAll: () => Promise<void>;
  disconnectAll: () => void | Promise<void>;
  runAction: (name: string, action: () => Promise<void>) => Promise<void>;
};

const ConnectionPanelActionsContext = createContext<ConnectionPanelActions | null>(null);

export function useConnectionPanelActions(): ConnectionPanelActions {
  const ctx = useContext(ConnectionPanelActionsContext);
  if (!ctx) {
    throw new Error("useConnectionPanelActions must be used under ConnectionPanelActionsProvider");
  }
  return ctx;
}

export function ConnectionPanelActionsProvider(props: {
  value: ConnectionPanelActions;
  children: ReactNode;
}) {
  return (
    <ConnectionPanelActionsContext.Provider value={props.value}>
      {props.children}
    </ConnectionPanelActionsContext.Provider>
  );
}
