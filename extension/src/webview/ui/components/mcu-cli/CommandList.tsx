import React from "react";
import * as Tabs from "@radix-ui/react-tabs";
import type { CliCommand } from "../../../cli-commands";
import {
  CLI_CATEGORIES,
  getCommandsByCategory,
  getCommand,
  getParamsForCommand,
} from "../../../cli-commands";
import { Button } from "../Button";

export interface CommandListProps {
  selectedCommandId: string | null;
  selectedSubcommandId: string | null;
  onSelectCommand: (cmdId: string | null) => void;
  onSelectSubcommand: (subId: string | null) => void;
  portOpen: boolean;
  onRun: (cmdId: string) => void;
}

const commandsByCategory = getCommandsByCategory();

export function CommandList({
  selectedCommandId,
  selectedSubcommandId,
  onSelectCommand,
  onSelectSubcommand,
  portOpen,
  onRun,
}: CommandListProps) {
  const selectedCmd = selectedCommandId
    ? getCommand(selectedCommandId)
    : undefined;
  const selectedParams = selectedCmd
    ? getParamsForCommand(selectedCmd, selectedSubcommandId)
    : undefined;
  const hasParams = (selectedParams?.length ?? 0) > 0;
  const hasSubcommands = (selectedCmd?.subcommands?.length ?? 0) > 0;
  const canRunNoParam =
    selectedCmd &&
    (!hasSubcommands || selectedSubcommandId) &&
    !hasParams;

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-3">Commands</h2>
      <Tabs.Root
        defaultValue={CLI_CATEGORIES[0]?.id ?? "info"}
        className="flex flex-col gap-2"
      >
        <Tabs.List className="flex flex-wrap gap-1 border-b border-gray-600 pb-2">
          {CLI_CATEGORIES.map((cat) => (
            <Tabs.Trigger
              key={cat.id}
              value={cat.id}
              className="px-3 py-1.5 rounded-t text-sm font-medium data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-400 hover:text-gray-200"
            >
              {cat.name}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        {CLI_CATEGORIES.map((cat) => {
          const cmds = commandsByCategory.get(cat.id) ?? [];
          return (
            <Tabs.Content
              key={cat.id}
              value={cat.id}
              className="flex flex-col gap-2 pt-2"
            >
              {cmds.map((cmd) => (
                <CommandRow
                  key={cmd.id}
                  cmd={cmd}
                  isSelected={selectedCommandId === cmd.id}
                  selectedSubcommandId={
                    selectedCommandId === cmd.id ? selectedSubcommandId : null
                  }
                  onSelectCommand={onSelectCommand}
                  onSelectSubcommand={onSelectSubcommand}
                  portOpen={portOpen}
                  onRun={onRun}
                  canRunNoParam={
                    Boolean(canRunNoParam && selectedCommandId === cmd.id)
                  }
                />
              ))}
            </Tabs.Content>
          );
        })}
      </Tabs.Root>
    </div>
  );
}

function CommandRow({
  cmd,
  isSelected,
  selectedSubcommandId,
  onSelectCommand,
  onSelectSubcommand,
  portOpen,
  onRun,
  canRunNoParam,
}: {
  cmd: CliCommand;
  isSelected: boolean;
  selectedSubcommandId: string | null;
  onSelectCommand: (id: string | null) => void;
  onSelectSubcommand: (id: string | null) => void;
  portOpen: boolean;
  onRun: (id: string) => void;
  canRunNoParam: boolean;
}) {
  const hasSubs = (cmd.subcommands?.length ?? 0) > 0;

  return (
    <div className="border border-gray-700 rounded p-2 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            onSelectCommand(isSelected ? null : cmd.id);
            onSelectSubcommand(null);
          }}
          className={`px-2 py-1 rounded text-sm font-medium ${
            isSelected ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"
          }`}
        >
          {cmd.name}
        </button>
        {hasSubs && isSelected && (
          <>
            {(cmd.subcommands ?? []).map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() =>
                  onSelectSubcommand(selectedSubcommandId === sub.id ? null : sub.id)
                }
                className={`px-2 py-1 rounded text-xs ${
                  selectedSubcommandId === sub.id
                    ? "bg-blue-500 text-white"
                    : "bg-gray-600 text-gray-300"
                }`}
              >
                {sub.name}
              </button>
            ))}
          </>
        )}
        {canRunNoParam && (
          <Button
            variant="secondary"
            onClick={() => onRun(cmd.id)}
            disabled={!portOpen}
            className="py-1! px-2! text-sm"
          >
            Run
          </Button>
        )}
      </div>
      {isSelected && cmd.description && (
        <p className="text-xs text-gray-400">{cmd.description}</p>
      )}
    </div>
  );
}
