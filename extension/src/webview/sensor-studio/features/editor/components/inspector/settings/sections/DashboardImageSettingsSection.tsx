import { TRNFormField, TRNInput, TRNSelect } from "../../../../../../../ui/TRN";
import { DashboardOpenLink } from "../../../../../dashboard/DashboardOpenLink";
import type { DashboardImageFitV1 } from "../../../../../../core/dashboard/dashboard-image-fit";
import { InspectorSettingsSectionFrame } from "../../InspectorSettingsSectionFrame";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import { DashboardPlacementPanel } from "./DashboardPlacementPanel";

const FIT_OPTIONS: { value: DashboardImageFitV1; label: string }[] = [
  { value: "contain", label: "Contain" },
  { value: "cover", label: "Cover" },
];

export function DashboardImageSettingsSection(props: NodeInspectorSettingsSectionProps) {
  const { selectedNode, onUpdateConfigField, onUpdateLabel } = props;
  const dc = selectedNode.data.defaultConfig as Record<string, unknown>;
  const label = typeof dc.label === "string" ? dc.label : "";
  const imageUrl = typeof dc.imageUrl === "string" ? dc.imageUrl : "";
  const caption = typeof dc.caption === "string" ? dc.caption : "";
  const objectFit = dc.objectFit === "cover" ? "cover" : "contain";

  return (
    <>
      <InspectorSettingsSectionFrame title="Dashboard Image">
        <div className="mb-2 flex justify-end">
          <DashboardOpenLink sourceNodeId={selectedNode.id} label="Open Dashboard" />
        </div>
        <p className="mb-3 text-[11px] leading-relaxed text-zinc-500">
          Image tile on the Dashboard pane. Wire an optional **URL** string input, or set a static
          image URL below.
        </p>
        <TRNFormField label="Tile label">
          <TRNInput
            value={label}
            onChange={(e) => {
              onUpdateConfigField("label", e.target.value);
              onUpdateLabel(e.target.value);
            }}
          />
        </TRNFormField>
        <div className="mt-3">
          <TRNFormField label="Image URL">
            <TRNInput
              value={imageUrl}
              onChange={(e) => onUpdateConfigField("imageUrl", e.target.value)}
            />
          </TRNFormField>
        </div>
        <div className="mt-3">
          <TRNFormField label="Caption">
            <TRNInput value={caption} onChange={(e) => onUpdateConfigField("caption", e.target.value)} />
          </TRNFormField>
        </div>
        <div className="mt-3">
          <TRNFormField label="Fit">
            <TRNSelect
              variant="field"
              size="sm"
              ariaLabel="Image fit mode"
              value={objectFit}
              options={FIT_OPTIONS}
              triggerClassName="w-full"
              onValueChange={(next) => onUpdateConfigField("objectFit", next)}
            />
          </TRNFormField>
        </div>
      </InspectorSettingsSectionFrame>
      <DashboardPlacementPanel {...props} />
    </>
  );
}
