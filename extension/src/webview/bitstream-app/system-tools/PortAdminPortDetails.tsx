/*******************************************************************************
 * File Name : PortAdminPortDetails.tsx
 *
 * Description : Readable / JSON port details with copy actions and inspect context.
 *
 * Author : Asst.Prof.Santi Nuratch, Ph.D
 * Thailand Embedded Systems Association (TESA)
 * Version : 1.1
 * Target : PSoC Edge E84 (shared)
 *
 *******************************************************************************/

import type { PortInfo } from "../../../serialport-bridge/protocol";
import { TRNHighlightedJsonBlock, TRNHintText } from "../../ui/TRN";
import type { PortDetailsViewMode } from "../../serialport/port-admin.store";
import {
  formatPortInfoAsJson,
  portInfoReadableRows,
} from "../../serialport/formatPortInfoReadable";
import { PortAdminCopyButton } from "./PortAdminCopyButton.js";

export type PortAdminPortDetailsProps = {
  selectedPort: PortInfo | null;
  viewMode: PortDetailsViewMode;
  inspectPath: string | null;
  targetPath: string;
};

function inspectContextCopy(
  inspectPath: string | null,
  targetPath: string,
): string | null
{
  if (inspectPath == null)
  {
    return null;
  }
  if (targetPath.length > 0 && inspectPath === targetPath)
  {
    return `Inspecting ${inspectPath} (active UART target)`;
  }
  if (targetPath.length > 0)
  {
    return `Inspecting ${inspectPath} · Active target is ${targetPath}`;
  }
  return `Inspecting ${inspectPath}`;
}

export function PortAdminPortDetails(props: PortAdminPortDetailsProps)
{
  const { selectedPort, viewMode, inspectPath, targetPath } = props;
  const contextLine = inspectContextCopy(inspectPath, targetPath);

  return (
    <div className="text-xs">
      {contextLine != null ? (
        <TRNHintText tone="info" className="mb-2">
          {contextLine}
        </TRNHintText>
      ) : null}
      {!selectedPort ? (
        <div className="text-zinc-400">Select a port row to inspect details.</div>
      ) : viewMode === "json" ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-end">
            <PortAdminCopyButton
              value={formatPortInfoAsJson(selectedPort)}
              label="port JSON"
            />
          </div>
          <TRNHighlightedJsonBlock
            value={formatPortInfoAsJson(selectedPort)}
            className="max-h-[min(22rem,50vh)] border-zinc-700/60 bg-zinc-950/40"
          />
        </div>
      ) : (
        <dl className="space-y-0">
          {portInfoReadableRows(selectedPort).map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[7.5rem_minmax(0,1fr)_auto] gap-x-3 border-b border-zinc-700/35 py-2 last:border-b-0"
            >
              <dt className="shrink-0 font-medium text-zinc-400">{row.label}</dt>
              <dd
                className={
                  "min-w-0 break-all text-zinc-100 " +
                  (row.monospace ? "font-mono" : "")
                }
              >
                {row.value}
              </dd>
              <dd className="shrink-0 self-start">
                {row.copyable ? (
                  <PortAdminCopyButton value={row.value} label={row.label} />
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
