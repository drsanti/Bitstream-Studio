import React from "react";
import type { CliParam } from "../../../cli-commands";
import { getParamsForCommand, getCommand } from "../../../cli-commands";
import { Button } from "../Button";
import { Input } from "../Input";

export interface ParameterFormProps {
  commandId: string | null;
  subcommandId: string | null;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  sending?: boolean;
}

export function ParameterForm({
  commandId,
  subcommandId,
  values,
  onChange,
  onSubmit,
  disabled,
  sending = false,
}: ParameterFormProps) {
  const cmd = commandId ? getCommand(commandId) : undefined;
  const params = cmd ? getParamsForCommand(cmd, subcommandId) : undefined;

  if (!params?.length) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-3">Parameters</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {params.map((p) => (
          <ParamInput
            key={p.key}
            param={p}
            value={values[p.key] ?? p.default ?? ""}
            onChange={(v) => onChange(p.key, v)}
            disabled={disabled}
          />
        ))}
        <Button
          type="submit"
          disabled={disabled || sending}
          className="self-start"
        >
          {sending ? "Sending…" : "Send"}
        </Button>
      </form>
    </div>
  );
}

function ParamInput({
  param,
  value,
  onChange,
  disabled,
}: {
  param: CliParam;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const label = param.label + (param.required ? " *" : "");

  if (param.options?.length) {
    return (
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        <select
          value={(value || param.default) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="rounded border border-gray-600 bg-gray-700 text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {param.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  const inputType =
    param.type === "number"
      ? "number"
      : param.type === "ip"
        ? "text"
        : "text";
  const placeholder =
    param.type === "ip" ? "e.g. 192.168.1.1" : param.default ?? "";

  return (
    <Input
      label={label}
      type={inputType}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}
