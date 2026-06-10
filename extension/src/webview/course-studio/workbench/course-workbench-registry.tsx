import {
  Box,
  FileText,
  LayoutGrid,
  ListTree,
  PenLine,
  SlidersHorizontal,
} from "lucide-react";
import type { WorkbenchRegistry } from "../../ui/workbench";
import { CourseContentWorkbenchPane } from "./panes/CourseContentWorkbenchPane";
import { CourseOutlineWorkbenchPane } from "./panes/CourseOutlineWorkbenchPane";
import { CourseDiagramWorkbenchPane } from "./panes/CourseDiagramWorkbenchPane";
import { CourseInspectorWorkbenchPane } from "./panes/CourseInspectorWorkbenchPane";
import { CourseMarkdownWorkbenchPane } from "./panes/CourseMarkdownWorkbenchPane";
import { CourseScene3dWorkbenchPane } from "./panes/CourseScene3dWorkbenchPane";
import { COURSE_WORKBENCH_PANE_LABELS } from "./course-workbench-pane-labels";

export const COURSE_STUDIO_WORKBENCH_REGISTRY: WorkbenchRegistry = {
  outline: {
    icon: <ListTree className="size-3.5" aria-hidden />,
    label: COURSE_WORKBENCH_PANE_LABELS.outline,
    component: CourseOutlineWorkbenchPane,
  },
  content: {
    icon: <LayoutGrid className="size-3.5" aria-hidden />,
    label: COURSE_WORKBENCH_PANE_LABELS.content,
    component: CourseContentWorkbenchPane,
  },
  inspector: {
    icon: <SlidersHorizontal className="size-3.5" aria-hidden />,
    label: COURSE_WORKBENCH_PANE_LABELS.inspector,
    component: CourseInspectorWorkbenchPane,
  },
  diagram: {
    icon: <PenLine className="size-3.5" aria-hidden />,
    label: COURSE_WORKBENCH_PANE_LABELS.diagram,
    component: CourseDiagramWorkbenchPane,
  },
  markdown: {
    icon: <FileText className="size-3.5" aria-hidden />,
    label: COURSE_WORKBENCH_PANE_LABELS.markdown,
    component: CourseMarkdownWorkbenchPane,
  },
  "scene-3d": {
    icon: <Box className="size-3.5" aria-hidden />,
    label: COURSE_WORKBENCH_PANE_LABELS["scene-3d"],
    component: CourseScene3dWorkbenchPane,
  },
};
