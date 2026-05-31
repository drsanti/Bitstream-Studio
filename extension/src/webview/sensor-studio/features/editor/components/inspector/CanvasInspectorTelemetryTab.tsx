import { Cpu, Radio } from "lucide-react";
import { useMemo } from "react";
import { twMerge } from "tailwind-merge";
import { TRNButton } from "../../../../../ui/TRN";
import type { StudioNode } from "../../store/flow-editor.store";
import {
  healthStatusLabel,
  healthStatusToneClass,
  listHardwareLinkedFlowNodes,
} from "./canvas-inspector-helpers";
import { InspectorSection } from "./InspectorSection";

export type CanvasInspectorTelemetryTabProps = {
  nodes: StudioNode[];
  onOpenDeviceSensorSettings?: (initialSourceId: number | null) => void;
};

export function CanvasInspectorTelemetryTab(props: CanvasInspectorTelemetryTabProps) {
  const { nodes, onOpenDeviceSensorSettings } = props;

  const linkedNodes = useMemo(() => listHardwareLinkedFlowNodes(nodes), [nodes]);
  const sortedLinkedNodes = useMemo(
    () =>
      [...linkedNodes].sort((a, b) =>
        a.data.label.localeCompare(b.data.label, undefined, { sensitivity: "base" }),
      ),
    [linkedNodes],
  );

  return (
    <div className="space-y-2">
      <InspectorSection
        title="Graph sensors"
        hint="Hardware-linked nodes on this canvas and their stream health."
      >
        {sortedLinkedNodes.length === 0 ? (
          <div className="rounded-md border border-dashed border-zinc-800/80 bg-zinc-950/25 px-2.5 py-4 text-center">
            <Radio className="mx-auto mb-2 h-4 w-4 text-zinc-600" aria-hidden />
            <p className="text-[11px] leading-snug text-zinc-500">
              No hardware-linked sensor nodes on the canvas.
            </p>
            <p className="mt-1 text-[10px] leading-snug text-zinc-600">
              Add nodes from the Library → Sensors section, or open Device settings below.
            </p>
          </div>
        ) : (
          <ul className="space-y-1">
            {sortedLinkedNodes.map((node) => (
              <li
                key={node.id}
                className="flex min-w-0 items-center gap-2 rounded-md border border-zinc-800/70 bg-zinc-950/35 px-2 py-1.5"
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-600"
                  style={{
                    backgroundColor:
                      node.data.sensorHealth === "live"
                        ? "rgb(52 211 153 / 0.9)"
                        : node.data.sensorHealth === "sim"
                          ? "rgb(167 139 250 / 0.9)"
                          : node.data.sensorHealth === "stale"
                            ? "rgb(251 191 36 / 0.9)"
                            : undefined,
                  }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[11px] font-medium text-zinc-200/95">
                    {node.data.label}
                  </div>
                  <div className="truncate font-mono text-[10px] text-zinc-600">
                    {node.data.nodeId}
                  </div>
                </div>
                <span
                  className={twMerge(
                    "shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium leading-none",
                    healthStatusToneClass(node.data.sensorHealth),
                  )}
                >
                  {healthStatusLabel(node.data.sensorHealth)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </InspectorSection>

      {onOpenDeviceSensorSettings != null ? (
        <InspectorSection
          title="Device configuration"
          hint="Shared firmware scope — affects all clients on this hardware."
        >
          <TRNButton
            size="compact"
            className="w-full"
            prefixIcon={<Cpu className="h-3 w-3" aria-hidden />}
            hint="Open shared device sensor settings (SENSOR_CFG, sampling, publish modes)."
            onClick={() => onOpenDeviceSensorSettings(null)}
          >
            Device sensors…
          </TRNButton>
        </InspectorSection>
      ) : null}
    </div>
  );
}
