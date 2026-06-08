import { useMemo } from "react";
import { Tag, Trash2 } from "lucide-react";
import {
  TRNDragHandle,
  TRNIconButton,
  TRNInlineEdit,
  TRNScrubNumberInput,
  TRNSortableContainer,
  TRNSortableItem,
  TRNSelect,
  TRNToggleSwitch,
} from "../../../../../ui/TRN";
import type { StudioPortType } from "../../store/flow-editor.store";
import { STUDIO_GROUP_SOCKET_PORT_TYPES } from "../../subgraphs/studio-group-interface-sync";
import type {
  StudioGroupSocketDef,
  StudioGroupSocketDefaultValue,
} from "../../subgraphs/studio-subgraph.types";
import { studioPortAccent } from "../../nodes/port-accent";
import { StudioPortTypeMenuIcon } from "../../nodes/studio-port-type-menu-icon";
import { buildStudioPortTypeSelectOptions } from "../../nodes/studio-port-type-select-options";
import { InspectorTextField } from "./InspectorNumericScrubRow";

export type GroupSocketSortableListProps = {
  sockets: StudioGroupSocketDef[];
  direction: "input" | "output";
  onRemove: (id: string) => void;
  onPatch: (
    id: string,
    patch: Partial<Pick<StudioGroupSocketDef, "label" | "portType" | "defaultValue">>,
  ) => void;
  onReorder: (next: StudioGroupSocketDef[]) => void;
  minSockets?: number;
};

const PORT_TYPE_OPTIONS = buildStudioPortTypeSelectOptions(STUDIO_GROUP_SOCKET_PORT_TYPES);

const DEFAULT_VALUE_PORT_TYPES = new Set<StudioPortType>(["number", "boolean", "string"]);

function supportsDefaultValue(portType: StudioPortType): boolean {
  return DEFAULT_VALUE_PORT_TYPES.has(portType);
}

function defaultSocketLabel(direction: "input" | "output"): string {
  return direction === "input" ? "Input" : "Output";
}

export function GroupSocketSortableList(props: GroupSocketSortableListProps) {
  const { sockets, direction, onRemove, onPatch, onReorder, minSockets = 1 } = props;
  const itemIds = useMemo(() => sockets.map((s) => s.id), [sockets]);
  const handleAccent = direction === "input" ? "#22d3ee" : "#fbbf24";

  if (sockets.length === 0) {
    return (
      <p className="text-[11px] leading-relaxed text-zinc-500">
        No sockets — use Add to create one.
      </p>
    );
  }

  return (
    <TRNSortableContainer
      itemIds={itemIds}
      className="flex flex-col gap-1.5"
      onReorder={(nextIds) => {
        const byId = new Map(sockets.map((s) => [s.id, s]));
        const next = nextIds.map((id) => byId.get(id)).filter((s): s is StudioGroupSocketDef => s != null);
        if (next.length === sockets.length) {
          onReorder(next);
        }
      }}
    >
      {sockets.map((socket) => {
        const accent = studioPortAccent(socket.portType);
        const canRemove = sockets.length > minSockets;
        const showDefault = direction === "input" && supportsDefaultValue(socket.portType);

        return (
          <TRNSortableItem
            key={socket.id}
            id={socket.id}
            className="rounded border border-zinc-700/70 bg-zinc-950/40 px-1.5 py-1.5"
            dragFx="lift"
          >
            <div className="flex min-w-0 items-start gap-1.5">
              <TRNDragHandle className="mt-1 shrink-0" />
              <span
                className="mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full border-2 bg-zinc-900"
                style={{ borderColor: handleAccent }}
                aria-hidden
              />
              <div className="min-w-0 flex-1 space-y-1">
                <InspectorTextField
                  ariaLabel="Socket name"
                  value={socket.label}
                  placeholder="Socket name"
                  leadingIcon={<Tag className="h-3.5 w-3.5" aria-hidden />}
                  onChange={(next) => {
                    onPatch(socket.id, { label: next });
                  }}
                  onBlur={() => {
                    const trimmed = socket.label.trim();
                    if (trimmed.length === 0) {
                      onPatch(socket.id, { label: defaultSocketLabel(direction) });
                    } else if (trimmed !== socket.label) {
                      onPatch(socket.id, { label: trimmed });
                    }
                  }}
                />
                <TRNSelect
                  value={socket.portType}
                  options={PORT_TYPE_OPTIONS}
                  ariaLabel={`${socket.label} port type`}
                  leadingIcon={<StudioPortTypeMenuIcon portType={socket.portType} />}
                  showSelectedIconInTrigger={false}
                  triggerClassName="nodrag h-7 w-full min-w-0"
                  panelClassName="scrollbar-hide min-w-[11rem]"
                  onValueChange={(next) => {
                    onPatch(socket.id, { portType: next as StudioPortType });
                  }}
                />
              </div>
              <TRNIconButton
                type="button"
                label={canRemove ? "Remove socket" : "At least one socket is required"}
                disabled={!canRemove}
                className="nodrag mt-0.5 shrink-0 text-zinc-400 hover:text-red-300 disabled:opacity-40"
                icon={<Trash2 className="h-3.5 w-3.5" aria-hidden />}
                onClick={() => {
                  if (canRemove) {
                    onRemove(socket.id);
                  }
                }}
              />
            </div>
            {showDefault ? (
              <div className="mt-1.5 flex min-w-0 items-center gap-2 border-t border-zinc-800/60 pt-1.5 pl-[1.375rem]">
                <span className="shrink-0 text-[9px] uppercase tracking-wide text-zinc-500">
                  Default
                </span>
                {socket.portType === "number" ? (
                  <TRNScrubNumberInput
                    className="nodrag min-w-0 flex-1"
                    value={typeof socket.defaultValue === "number" ? socket.defaultValue : 0}
                    onValueChange={(next) => {
                      onPatch(socket.id, { defaultValue: next });
                    }}
                  />
                ) : socket.portType === "boolean" ? (
                  <TRNToggleSwitch
                    checked={socket.defaultValue === true}
                    ariaLabel="Default boolean when parent wire is missing"
                    onCheckedChange={(checked) => {
                      onPatch(socket.id, { defaultValue: checked });
                    }}
                  />
                ) : (
                  <TRNInlineEdit
                    className="nodrag min-w-0 flex-1 text-[11px]"
                    value={typeof socket.defaultValue === "string" ? socket.defaultValue : ""}
                    placeholder="(empty)"
                    onCommit={(next) => {
                      const trimmed = next.trim();
                      const value: StudioGroupSocketDefaultValue =
                        trimmed.length > 0 ? trimmed : "";
                      onPatch(socket.id, { defaultValue: value });
                    }}
                  />
                )}
                <span
                  className="inline-block h-2 w-2 shrink-0 rounded-full border border-zinc-600"
                  style={{ backgroundColor: accent }}
                  aria-hidden
                />
              </div>
            ) : null}
          </TRNSortableItem>
        );
      })}
    </TRNSortableContainer>
  );
}
