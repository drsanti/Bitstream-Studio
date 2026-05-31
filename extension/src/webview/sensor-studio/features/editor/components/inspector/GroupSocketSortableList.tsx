import { useMemo } from "react";
import { Trash2 } from "lucide-react";
import {
  TRNDragHandle,
  TRNFormField,
  TRNIconButton,
  TRNInlineEdit,
  TRNSortableContainer,
  TRNSortableItem,
  TRNSelect,
  type TRNSelectOption,
} from "../../../../../ui/TRN";
import type { StudioPortType } from "../../store/flow-editor.store";
import {
  STUDIO_GROUP_SOCKET_PORT_TYPES,
} from "../../subgraphs/studio-group-interface-sync";
import type { StudioGroupSocketDef } from "../../subgraphs/studio-subgraph.types";
import { studioPortAccent } from "../../nodes/port-accent";

export type GroupSocketSortableListProps = {
  sockets: StudioGroupSocketDef[];
  onRemove: (id: string) => void;
  onPatch: (id: string, patch: Partial<Pick<StudioGroupSocketDef, "label" | "portType">>) => void;
  onReorder: (next: StudioGroupSocketDef[]) => void;
  minSockets?: number;
};

const PORT_TYPE_OPTIONS: TRNSelectOption[] = STUDIO_GROUP_SOCKET_PORT_TYPES.map((portType) => ({
  value: portType,
  label: portType,
}));

export function GroupSocketSortableList(props: GroupSocketSortableListProps) {
  const { sockets, onRemove, onPatch, onReorder, minSockets = 1 } = props;
  const itemIds = useMemo(() => sockets.map((s) => s.id), [sockets]);

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
      className="flex flex-col gap-2"
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
        return (
          <TRNSortableItem
            key={socket.id}
            id={socket.id}
            className="rounded border border-zinc-700/70 bg-zinc-950/40 p-2"
            dragFx="lift"
          >
            <div className="flex items-start gap-1.5">
              <TRNDragHandle className="mt-1 shrink-0" />
              <div className="min-w-0 flex-1 space-y-2">
                <TRNFormField label="Label" id={`gsock-label-${socket.id}`} className="space-y-1">
                  <TRNInlineEdit
                    value={socket.label}
                    onCommit={(next) => {
                      const trimmed = next.trim();
                      if (trimmed.length > 0 && trimmed !== socket.label) {
                        onPatch(socket.id, { label: trimmed });
                      }
                    }}
                  />
                </TRNFormField>
                <TRNFormField label="Type" id={`gsock-type-${socket.id}`} className="space-y-1">
                  <TRNSelect
                    value={socket.portType}
                    options={PORT_TYPE_OPTIONS}
                    ariaLabel="Socket port type"
                    triggerClassName="w-full"
                    onValueChange={(next) => {
                      onPatch(socket.id, { portType: next as StudioPortType });
                    }}
                  />
                </TRNFormField>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                  <span
                    className="inline-block h-2 w-2 rounded-full border border-zinc-600"
                    style={{ backgroundColor: accent }}
                    aria-hidden
                  />
                  <span className="font-mono">{socket.id}</span>
                </div>
              </div>
              <TRNIconButton
                type="button"
                label={canRemove ? "Remove socket" : "At least one socket is required"}
                disabled={!canRemove}
                className="shrink-0 text-zinc-400 hover:text-red-300 disabled:opacity-40"
                icon={<Trash2 className="h-3.5 w-3.5" aria-hidden />}
                onClick={() => {
                  if (canRemove) {
                    onRemove(socket.id);
                  }
                }}
              />
            </div>
          </TRNSortableItem>
        );
      })}
    </TRNSortableContainer>
  );
}
