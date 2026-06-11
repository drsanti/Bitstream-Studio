import { createContext, useContext, type ReactNode } from "react";
import type { StudioLayoutProps } from "../studio-layout.props";

const StudioWorkbenchShellContext = createContext<StudioLayoutProps | null>(null);

export function StudioWorkbenchShellProvider({
  value,
  children,
}: {
  value: StudioLayoutProps;
  children: ReactNode;
}) {
  return <StudioWorkbenchShellContext.Provider value={value}>{children}</StudioWorkbenchShellContext.Provider>;
}

export function useStudioWorkbenchShell(): StudioLayoutProps {
  const ctx = useContext(StudioWorkbenchShellContext);
  if (ctx == null) {
    throw new Error("useStudioWorkbenchShell must be used inside StudioWorkbenchShellProvider");
  }
  return ctx;
}

export function useOptionalStudioWorkbenchShell(): StudioLayoutProps | null {
  return useContext(StudioWorkbenchShellContext);
}
