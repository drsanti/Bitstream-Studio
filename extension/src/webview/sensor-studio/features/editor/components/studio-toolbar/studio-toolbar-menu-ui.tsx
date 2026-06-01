import {
  Copy,
  Download,
  FileJson,
  MousePointerClick,
  Pencil,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const STUDIO_TOOLBAR_MENU_ICONS = {
  editTrigger: Pencil,
  fileTrigger: FileJson,
  duplicate: Copy,
  delete: Trash2,
  selectAll: MousePointerClick,
  clearSelection: XCircle,
  exportFlow: Download,
  importFlow: Upload,
} as const satisfies Record<string, LucideIcon>;
