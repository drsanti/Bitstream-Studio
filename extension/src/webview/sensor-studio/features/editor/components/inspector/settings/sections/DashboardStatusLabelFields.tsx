import { InspectorSelectField } from "../../InspectorDenseControls";
import type { NodeInspectorSettingsSectionProps } from "../node-inspector-settings-types";
import {
  coerceDashboardStatusToneV1,
  type DashboardStatusToneV1,
} from "../../../../../../core/dashboard/dashboard-status-style";

const TONE_OPTIONS: { value: DashboardStatusToneV1; label: string }[] = [
  { value: "success", label: "Success" },
  { value: "warn", label: "Warning" },
  { value: "danger", label: "Danger" },
  { value: "neutral", label: "Neutral" },
];

type DashboardStatusLabelFieldsProps = Pick<
  NodeInspectorSettingsSectionProps,
  "selectedNode" | "onUpdateConfigField"
>;

export function DashboardStatusLabelFields(props: DashboardStatusLabelFieldsProps) {
  const { selectedNode, onUpdateConfigField } = props;
  const dc = selectedNode.data.defaultConfig as Record<string, unknown>;
  const onLabel = typeof dc.onLabel === "string" ? dc.onLabel : "OK";
  const offLabel = typeof dc.offLabel === "string" ? dc.offLabel : "Fault";
  const onTone = coerceDashboardStatusToneV1(dc.onTone ?? "success");
  const offTone = coerceDashboardStatusToneV1(dc.offTone ?? "danger");

  return (
    <div className="space-y-2">
      <div>
        <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-zinc-500">
          Active label
        </label>
        <input
          type="text"
          className="w-full rounded-md border border-zinc-700/80 bg-zinc-900/60 px-2 py-1.5 text-[12px] text-zinc-100 outline-none focus:border-cyan-500/50"
          value={onLabel}
          onChange={(e) => onUpdateConfigField("onLabel", e.target.value)}
        />
      </div>
      <InspectorSelectField
        label="Active tone"
        value={onTone}
        options={TONE_OPTIONS.map((row) => ({ value: row.value, label: row.label }))}
        onChange={(v) => onUpdateConfigField("onTone", v)}
      />
      <div>
        <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-zinc-500">
          Inactive label
        </label>
        <input
          type="text"
          className="w-full rounded-md border border-zinc-700/80 bg-zinc-900/60 px-2 py-1.5 text-[12px] text-zinc-100 outline-none focus:border-cyan-500/50"
          value={offLabel}
          onChange={(e) => onUpdateConfigField("offLabel", e.target.value)}
        />
      </div>
      <InspectorSelectField
        label="Inactive tone"
        value={offTone}
        options={TONE_OPTIONS.map((row) => ({ value: row.value, label: row.label }))}
        onChange={(v) => onUpdateConfigField("offTone", v)}
      />
    </div>
  );
}
