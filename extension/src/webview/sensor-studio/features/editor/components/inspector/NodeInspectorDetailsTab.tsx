import { Info, Settings, Share2 } from "lucide-react";
import { useState } from "react";
import type { NodeCatalogEntry } from "../../../../core/config/config-types";
import type { DeviceSensorConfigRow } from "../../../../../bitstream-app/state/bitstreamDeviceSensorConfig.store";
import { getSensorSourceDisplayLabel } from "../../../../../bitstream-app/constants/sensorSourceIds";
import { SENSOR_CFG_UI } from "../../../../../bitstream-app/constants/sensorConfigUiLabels";
import {
  TRNAccordion,
  TRNAccordionContent,
  TRNAccordionItem,
  TRNAccordionTrigger,
  TRNMenuSectionTitle,
} from "../../../../../ui/TRN";
import { studioPortAccent } from "../../nodes/port-accent";
import type { StudioNode } from "../../store/flow-editor.store";
import {
  DETAILS_SHARED_DEVICE_ACCORDION_VALUE,
  readDetailsSharedDeviceAccordionValue,
  writeDetailsSharedDeviceAccordionValue,
} from "./node-inspector-ui-persistence";

export type NodeInspectorDetailsTabProps = {
  selectedNode: StudioNode;
  catalogEntry: NodeCatalogEntry | undefined;
  categoryTint: string;
  deviceSourceId: number | null;
  deviceRow: DeviceSensorConfigRow | null;
  onOpenDeviceSensorSettings?: (initialSourceId: number | null) => void;
};

export function NodeInspectorDetailsTab(props: NodeInspectorDetailsTabProps) {
  const {
    selectedNode,
    catalogEntry,
    categoryTint,
    deviceSourceId,
    deviceRow,
    onOpenDeviceSensorSettings,
  } = props;

  const [sharedDeviceAccordionValue, setSharedDeviceAccordionValue] =
    useState<string>(() => readDetailsSharedDeviceAccordionValue() ?? "");

  return (
    <div className="space-y-2 text-xs">
      <div className="space-y-1.5 rounded border border-zinc-700/70 bg-zinc-950/35 px-2 py-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-zinc-500">Category</span>
          <span
            className="rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            style={{
              borderColor: `${categoryTint}66`,
              color: categoryTint,
              backgroundColor: `${categoryTint}18`,
            }}
          >
            {selectedNode.data.category}
          </span>
        </div>
        {catalogEntry != null ? (
          <div className="space-y-0.5">
            <div className="text-[11px] text-zinc-500">Definition</div>
            <div className="text-[11px] font-medium text-zinc-200">
              {catalogEntry.title}
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-400">
              {catalogEntry.description}
            </p>
          </div>
        ) : null}
        <div>
          <div className="text-[11px] text-zinc-500">Type id</div>
          <div className="mt-0.5 break-all font-mono text-[11px] text-zinc-300">
            {selectedNode.data.nodeId}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-zinc-500">Ports</div>
          <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
            {selectedNode.data.inputType != null ? (
              <span className="rounded border border-zinc-700/80 bg-zinc-800/60 px-1 py-0.5 text-zinc-300">
                in:{selectedNode.data.inputType}
              </span>
            ) : null}
            {selectedNode.data.outputHandles != null &&
            selectedNode.data.outputHandles.length > 0 ? (
              selectedNode.data.outputHandles.map((h) => (
                <span
                  key={h.id}
                  className="rounded border border-zinc-700/80 bg-zinc-800/60 px-1 py-0.5 text-zinc-300"
                  style={{
                    borderColor: `${studioPortAccent(h.portType)}55`,
                  }}
                >
                  {h.id}:{h.portType}
                </span>
              ))
            ) : selectedNode.data.outputType != null ? (
              <span className="rounded border border-zinc-700/80 bg-zinc-800/60 px-1 py-0.5 text-zinc-300">
                out:{selectedNode.data.outputType}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {deviceSourceId != null ? (
        <div className="overflow-hidden rounded-md border border-sky-800/40 bg-linear-to-br from-sky-950/30 via-zinc-950/50 to-zinc-950/80 shadow-[inset_0_1px_0_0_rgba(56,189,248,0.06)]">
          <TRNAccordion
            type="single"
            collapsible
            className="border-0 bg-transparent"
            value={sharedDeviceAccordionValue}
            onValueChange={(next) => {
              const raw = typeof next === "string" ? next : "";
              const normalized =
                raw === DETAILS_SHARED_DEVICE_ACCORDION_VALUE
                  ? DETAILS_SHARED_DEVICE_ACCORDION_VALUE
                  : "";
              setSharedDeviceAccordionValue(normalized);
              writeDetailsSharedDeviceAccordionValue(
                normalized === "" ? undefined : DETAILS_SHARED_DEVICE_ACCORDION_VALUE,
              );
            }}
          >
            <TRNAccordionItem value="shared-device" className="border-0">
              <TRNAccordionTrigger
                className="px-2 py-0 text-[11px] font-medium text-sky-100/90 hover:bg-sky-950/25 focus-within:ring-1 focus-within:ring-sky-400/35"
                trailingBeforeChevron={
                  <button
                    type="button"
                    title="Open device sensor settings"
                    aria-label="Open device sensor settings"
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-transparent p-0 text-sky-400/80 hover:text-sky-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sky-400/45"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onOpenDeviceSensorSettings?.(deviceSourceId);
                    }}
                  >
                    <Settings
                      className="h-3.5 w-3.5 transition-colors duration-150"
                      strokeWidth={2.25}
                      aria-hidden
                    />
                  </button>
                }
              >
                <span className="flex w-full min-w-0 items-center gap-2">
                  <Share2
                    className="h-3.5 w-3.5 shrink-0 text-sky-300/85"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                  <span className="min-w-0 truncate">
                    Shared device · {getSensorSourceDisplayLabel(deviceSourceId)}
                  </span>
                  {deviceRow != null ? (
                    <span className="shrink-0 rounded border border-sky-600/35 bg-sky-950/50 px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-sky-200/75">
                      cfg
                    </span>
                  ) : (
                    <span className="shrink-0 rounded border border-zinc-600/50 bg-zinc-950/60 px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-zinc-400">
                      no row
                    </span>
                  )}
                </span>
              </TRNAccordionTrigger>
              <TRNAccordionContent
                className="border-t border-sky-900/30 bg-zinc-950/40"
                innerClassName="px-2 pb-2 pt-1.5 text-[11px] leading-normal text-zinc-300"
              >
                <div className="space-y-2">
                  {deviceRow == null ? (
                    <div className="overflow-hidden rounded-md border border-zinc-800/70 bg-zinc-950/55">
                      <div className="flex items-center justify-between gap-2 border-b border-zinc-800/70 bg-zinc-900/35 px-2 py-1">
                        <TRNMenuSectionTitle spacing="labelOnly">sensor.cfg</TRNMenuSectionTitle>
                        <span className="rounded border border-zinc-700/60 px-1 py-px text-[9px] font-medium uppercase tracking-wide text-zinc-500">
                          empty
                        </span>
                      </div>
                      <p className="px-2 py-2 text-[11px] leading-relaxed text-zinc-400">
                        No verified row yet. Use the gear control or{" "}
                        <span className="font-mono text-zinc-300">
                          Device sensors…
                        </span>{" "}
                        in the toolbar to refresh from firmware.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-md border border-zinc-800/70 bg-zinc-950/55">
                      <div className="flex items-center justify-between gap-2 border-b border-zinc-800/70 bg-zinc-900/35 px-2 py-1">
                        <TRNMenuSectionTitle spacing="labelOnly">
                          sensor.cfg snapshot
                        </TRNMenuSectionTitle>
                        <span className="text-[9px] font-medium uppercase tracking-wide text-zinc-600">
                          read-only
                        </span>
                      </div>
                      <table className="w-full border-collapse text-left">
                        <tbody>
                          <tr className="border-b border-zinc-800/55">
                            <th
                              scope="row"
                              className="max-w-[52%] py-1.5 pl-2 pr-2 align-middle font-normal text-zinc-500"
                            >
                              Enabled
                            </th>
                            <td
                              className={
                                "py-1.5 pr-2 text-right align-middle " +
                                (deviceRow.enabled
                                  ? "text-sky-300/85"
                                  : "text-zinc-500")
                              }
                            >
                              {String(deviceRow.enabled)}
                            </td>
                          </tr>
                          <tr className="border-b border-zinc-800/55">
                            <th
                              scope="row"
                              className="py-1.5 pl-2 pr-2 align-middle font-normal text-zinc-500"
                            >
                              {SENSOR_CFG_UI.telemetryMode}
                            </th>
                            <td className="py-1.5 pr-2 text-right align-middle text-sky-200/80">
                              {deviceRow.publishMode}
                            </td>
                          </tr>
                          <tr className="border-b border-zinc-800/55">
                            <th
                              scope="row"
                              className="py-1.5 pl-2 pr-2 align-middle font-normal text-zinc-500"
                            >
                              Sample rate (ms)
                            </th>
                            <td className="py-1.5 pr-2 text-right align-middle text-sky-200/80">
                              {deviceRow.samplingIntervalMs}
                            </td>
                          </tr>
                          <tr className="border-b border-zinc-800/55">
                            <th
                              scope="row"
                              className="py-1.5 pl-2 pr-2 align-middle font-normal text-zinc-500"
                            >
                              {SENSOR_CFG_UI.minPublishInterval} (ms)
                            </th>
                            <td className="py-1.5 pr-2 text-right align-middle text-sky-200/80">
                              {deviceRow.minPublishIntervalMs}
                            </td>
                          </tr>
                          <tr className="border-b border-zinc-800/55">
                            <th
                              scope="row"
                              className="py-1.5 pl-2 pr-2 align-middle font-normal text-zinc-500"
                            >
                              Delta (×100)
                            </th>
                            <td className="py-1.5 pr-2 text-right align-middle text-sky-200/80">
                              {deviceRow.deltaX100}
                            </td>
                          </tr>
                          <tr>
                            <th
                              scope="row"
                              className="py-1.5 pl-2 pr-2 align-middle font-normal text-zinc-500"
                            >
                              Updated
                            </th>
                            <td className="py-1.5 pr-2 text-right align-middle text-[10px] text-zinc-400">
                              {typeof deviceRow.updatedAtMs === "number" &&
                              Number.isFinite(deviceRow.updatedAtMs)
                                ? new Date(deviceRow.updatedAtMs).toLocaleString(
                                    undefined,
                                    {
                                      dateStyle: "medium",
                                      timeStyle: "medium",
                                    },
                                  )
                                : String(deviceRow.updatedAtMs)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="flex gap-2 rounded-md border border-sky-900/30 bg-sky-950/20 px-2 py-1.5 text-[10px] leading-snug text-zinc-500">
                    <Info
                      className="mt-px h-3.5 w-3.5 shrink-0 text-sky-400/80"
                      strokeWidth={2.25}
                      aria-hidden
                    />
                    <p className="min-w-0">
                      Hardware-backed — edits sync across everyone connected to
                      this device / broker.
                    </p>
                  </div>
                </div>
              </TRNAccordionContent>
            </TRNAccordionItem>
          </TRNAccordion>
        </div>
      ) : null}
    </div>
  );
}
