import type { MonitorToolId } from "./tools/monitorToolTypes";

const TOOLS: { id: MonitorToolId; label: string }[] = [
  { id: "control", label: "Control" },
  { id: "matrix", label: "Matrix" },
  { id: "probe", label: "UART Probe" },
  { id: "ratecheck", label: "Rate Check" },
  { id: "sim", label: "Sim Scenarios" },
  { id: "injector", label: "WS Injector" },
  { id: "mock", label: "Mock Probe" },
];

type Props = {
  activeTool: MonitorToolId;
  onChange: (tool: MonitorToolId) => void;
};

export function MonitorToolTabBar(props: Props) {
  return (
    <div className="flex shrink-0 gap-0 overflow-x-auto border-b border-zinc-800 bg-[#161b22] px-3">
      {TOOLS.map((tool) => {
        const active = props.activeTool === tool.id;
        return (
          <button
            key={tool.id}
            type="button"
            className={`border-b-2 px-4 py-2.5 text-xs font-medium transition-colors ${
              active
                ? "border-sky-500 text-sky-400"
                : "border-transparent text-zinc-500 hover:text-zinc-200"
            }`}
            onClick={() => props.onChange(tool.id)}
          >
            {tool.label}
          </button>
        );
      })}
    </div>
  );
}
