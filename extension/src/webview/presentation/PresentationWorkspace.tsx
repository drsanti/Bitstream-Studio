import { useEffect } from "react";

import { bootstrapPresentationCourseDiagramBridge } from "../course-studio/content/bootstrapPresentationCourseDiagramBridge";

import { PresentationShell } from "./layout/PresentationShell";

/** Bitstream Studio workspace: training / slide presentation. */
export function PresentationWorkspace() {
  useEffect(() => {
    bootstrapPresentationCourseDiagramBridge();
  }, []);

  return <PresentationShell />;
}