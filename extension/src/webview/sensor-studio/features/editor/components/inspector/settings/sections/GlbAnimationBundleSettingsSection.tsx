import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import { GlbAnimationBundleConnectionSection } from "./GlbAnimationBundleConnectionSection";

/** @deprecated Use {@link GlbAnimationBundleConnectionSection} on Node tab + Animation tab. */
export function GlbAnimationBundleSettingsSection(props: NodeInspectorSettingsSectionProps) {
  return <GlbAnimationBundleConnectionSection {...props} />;
}
