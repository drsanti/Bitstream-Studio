import type { StudioNode, StudioPortType } from "../../store/flow-editor.store";
import {
  STUDIO_HANDLE_IN,
  STUDIO_HANDLE_OUT,
} from "../../store/flow-editor.store";
import { studioPortAccent } from "../../nodes/port-accent";

export type InspectorPortRow = {
  direction: "in" | "out";
  pin: string;
  portType: StudioPortType;
  label: string;
};

export function collectInspectorPortRows(node: StudioNode): InspectorPortRow[] {
  const rows: InspectorPortRow[] = [];
  const { inputHandles, inputType, outputHandles, outputType } = node.data;

  if (inputHandles != null && inputHandles.length > 0) {
    for (const h of inputHandles) {
      rows.push({
        direction: "in",
        pin: h.id,
        portType: h.portType,
        label: h.label,
      });
    }
  } else if (inputType != null) {
    rows.push({
      direction: "in",
      pin: STUDIO_HANDLE_IN,
      portType: inputType,
      label: "",
    });
  }

  if (outputHandles != null && outputHandles.length > 0) {
    for (const h of outputHandles) {
      rows.push({
        direction: "out",
        pin: h.id,
        portType: h.portType,
        label: h.label,
      });
    }
  } else if (outputType != null) {
    rows.push({
      direction: "out",
      pin: STUDIO_HANDLE_OUT,
      portType: outputType,
      label: "",
    });
  }

  return rows;
}

export function formatInspectorPortsHint(rows: InspectorPortRow[]): string {
  const inCount = rows.filter((r) => r.direction === "in").length;
  const outCount = rows.filter((r) => r.direction === "out").length;
  const parts: string[] = [];
  if (outCount > 0) {
    parts.push(`${outCount} output${outCount === 1 ? "" : "s"}`);
  }
  if (inCount > 0) {
    parts.push(`${inCount} input${inCount === 1 ? "" : "s"}`);
  }
  return parts.join(" · ");
}

export type InspectorPortsTableProps = {
  rows: InspectorPortRow[];
};

export function InspectorPortsTable(props: InspectorPortsTableProps) {
  const { rows } = props;

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-0 border-collapse text-left text-[11px]">
        <thead>
          <tr className="border-b border-zinc-800/70 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            <th scope="col" className="pb-1.5 pr-2 font-medium">
              I/O
            </th>
            <th scope="col" className="pb-1.5 pr-2 font-medium">
              Pin
            </th>
            <th scope="col" className="pb-1.5 pr-2 font-medium">
              Type
            </th>
            <th scope="col" className="pb-1.5 font-medium">
              Label
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const accent = studioPortAccent(row.portType);
            return (
              <tr
                key={`${row.direction}-${row.pin}`}
                className="border-b border-zinc-800/50 last:border-b-0"
              >
                <td className="py-1.5 pr-2 align-middle uppercase text-[10px] text-zinc-500">
                  {row.direction}
                </td>
                <td className="py-1.5 pr-2 align-middle font-mono text-zinc-300">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: accent }}
                      aria-hidden
                    />
                    {row.pin}
                  </span>
                </td>
                <td className="py-1.5 pr-2 align-middle">
                  <span
                    className="rounded border px-1 py-px font-mono text-[10px] text-zinc-300"
                    style={{ borderColor: `${accent}55` }}
                  >
                    {row.portType}
                  </span>
                </td>
                <td className="py-1.5 align-middle text-zinc-400">
                  {row.label.trim().length > 0 ? row.label : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
