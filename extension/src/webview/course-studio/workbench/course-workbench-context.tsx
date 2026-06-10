import { createContext, useContext, type ReactNode, type RefObject } from "react";
import type { StandaloneWorkbenchHandle } from "../../ui/workbench";

export type CourseWorkbenchShellContextValue = {
  workbenchRef: RefObject<StandaloneWorkbenchHandle | null>;
  focusWorkbenchPane: (editorType: string) => void;
  applyWorkbenchPreset: (presetId: string) => boolean;
  resetWorkbenchLayout: () => void;
};

const CourseWorkbenchShellContext = createContext<CourseWorkbenchShellContextValue | null>(null);

export function CourseWorkbenchShellProvider({
  value,
  children,
}: {
  value: CourseWorkbenchShellContextValue;
  children: ReactNode;
}) {
  return (
    <CourseWorkbenchShellContext.Provider value={value}>
      {children}
    </CourseWorkbenchShellContext.Provider>
  );
}

export function useCourseWorkbenchShell(): CourseWorkbenchShellContextValue {
  const ctx = useContext(CourseWorkbenchShellContext);
  if (ctx == null) {
    throw new Error("useCourseWorkbenchShell must be used within CourseWorkbenchShellProvider");
  }
  return ctx;
}
