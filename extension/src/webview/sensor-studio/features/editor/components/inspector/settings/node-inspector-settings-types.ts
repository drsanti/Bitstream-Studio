import type { StudioNode } from "../../../store/flow-editor.store";

/** Props passed to each catalog-specific settings section under the Settings tab. */
export type NodeInspectorSettingsSectionProps = {
  selectedNode: StudioNode;
  onUpdateConfigField: (key: string, value: unknown) => boolean;
  sourceKeyDraft: string;
  setSourceKeyDraft: (next: string) => void;
  sourceKeyFieldError: string | null;
  setSourceKeyFieldError: (next: string | null) => void;
};
