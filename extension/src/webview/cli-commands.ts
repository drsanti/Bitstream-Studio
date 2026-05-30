/**
 * CM55 CLI command metadata for MCU CLI UI.
 * Derived from TESAIoT_Library CM55/cm55_cli CLI_COMMANDS_LIST.md and CLI_CM55_COMMANDS.md.
 */

export type CliCategoryId =
  | "info"
  | "system-time"
  | "network"
  | "wifi"
  | "udp"
  | "ipc"
  | "led-buttons"
  | "display"
  | "sensors"
  | "imu"
  | "touch"
  | "mag"
  | "destructive";

export interface CliCategory {
  id: CliCategoryId;
  name: string;
}

export const CLI_CATEGORIES: CliCategory[] = [
  { id: "info", name: "Info" },
  { id: "system-time", name: "System / Time" },
  { id: "network", name: "Network" },
  { id: "wifi", name: "WiFi" },
  { id: "udp", name: "UDP" },
  { id: "ipc", name: "IPC" },
  { id: "led-buttons", name: "LED / Buttons" },
  { id: "display", name: "Display" },
  { id: "sensors", name: "Sensors" },
  { id: "imu", name: "IMU" },
  { id: "touch", name: "Touch" },
  { id: "mag", name: "Mag" },
  { id: "destructive", name: "Destructive" },
];

export type ParamType = "text" | "number" | "ip";

export interface CliParam {
  key: string;
  label: string;
  type: ParamType;
  required?: boolean;
  default?: string;
  /** Enum options for picker (e.g. quat | euler | data). */
  options?: string[];
}

export interface CliSubcommand {
  id: string;
  name: string;
  description?: string;
  params?: CliParam[];
}

export interface CliCommand {
  id: string;
  name: string;
  description: string;
  category: CliCategoryId;
  destructive?: boolean;
  subcommands?: CliSubcommand[];
  params?: CliParam[];
}

export const CLI_COMMANDS: CliCommand[] = [
  { id: "help", name: "help", description: "List commands and short help", category: "info" },
  { id: "version", name: "version", description: "Firmware/CLI version string", category: "info" },
  { id: "clear", name: "clear", description: "Clear the terminal screen", category: "info" },
  {
    id: "echo",
    name: "echo",
    description: "Echo arguments to output",
    category: "info",
    params: [{ key: "text", label: "Text", type: "text", required: false }],
  },
  { id: "uptime", name: "uptime", description: "Print time since boot (seconds)", category: "info" },
  { id: "heap", name: "heap", description: "Print FreeRTOS heap free (bytes)", category: "info" },
  {
    id: "time",
    name: "time",
    description: "Date/time",
    category: "system-time",
    subcommands: [
      { id: "now", name: "now", description: "Current time" },
      { id: "full", name: "full", description: "Full date/time" },
      { id: "date", name: "date", description: "Date" },
      { id: "clock", name: "clock", description: "Clock" },
      {
        id: "set",
        name: "set",
        description: "Set date/time",
        params: [
          { key: "hour", label: "Hour", type: "number", required: true },
          { key: "min", label: "Min", type: "number", required: true },
          { key: "sec", label: "Sec", type: "number", required: true },
          { key: "day", label: "Day", type: "number", required: true },
          { key: "month", label: "Month", type: "number", required: true },
          { key: "year", label: "Year", type: "number", required: true },
        ],
      },
      { id: "sync", name: "sync", description: "Sync" },
      { id: "ntp", name: "ntp", description: "NTP" },
    ],
  },
  { id: "date", name: "date", description: "Print current date (YYYY-MM-DD)", category: "info" },
  {
    id: "sysinfo",
    name: "sysinfo",
    description: "System snapshot (uptime, heap, time, tasks)",
    category: "info",
  },
  {
    id: "log",
    name: "log",
    description: "Log path info",
    category: "info",
    subcommands: [
      { id: "status", name: "status", description: "Log status" },
      {
        id: "level",
        name: "level",
        description: "Set log level",
        params: [{
          key: "level",
          label: "Level",
          type: "text",
          required: true,
          options: ["none", "error", "warn", "info", "debug", "verbose"],
        }],
      },
    ],
  },
  { id: "tasks", name: "tasks", description: "List FreeRTOS tasks", category: "info" },
  { id: "stats", name: "stats", description: "CM55 idle % (when run-time stats enabled)", category: "info" },
  {
    id: "buttons",
    name: "buttons",
    description: "Button states",
    category: "led-buttons",
    subcommands: [{ id: "status", name: "status", description: "Button status" }],
  },
  {
    id: "led",
    name: "led",
    description: "User LED control (CM55 local: red/green/blue/all)",
    category: "led-buttons",
    subcommands: [
      { id: "on", name: "on", description: "All LEDs on" },
      { id: "off", name: "off", description: "All LEDs off" },
      { id: "toggle", name: "toggle", description: "All LEDs toggle" },
      { id: "red_on", name: "red on", description: "Red LED on" },
      { id: "red_off", name: "red off", description: "Red LED off" },
      { id: "red_toggle", name: "red toggle", description: "Red LED toggle" },
      { id: "green_on", name: "green on", description: "Green LED on" },
      { id: "green_off", name: "green off", description: "Green LED off" },
      { id: "green_toggle", name: "green toggle", description: "Green LED toggle" },
      { id: "blue_on", name: "blue on", description: "Blue LED on" },
      { id: "blue_off", name: "blue off", description: "Blue LED off" },
      { id: "blue_toggle", name: "blue toggle", description: "Blue LED toggle" },
      { id: "all_on", name: "all on", description: "All LEDs on" },
      { id: "all_off", name: "all off", description: "All LEDs off" },
      { id: "all_toggle", name: "all toggle", description: "All LEDs toggle" },
    ],
  },
  {
    id: "capsense",
    name: "capsense",
    description: "CapSense button/slider state (CM55 local when CAPSENSE_ENABLE)",
    category: "led-buttons",
    subcommands: [{ id: "status", name: "status", description: "Button/slider state" }],
  },
  {
    id: "cap",
    name: "cap",
    description: "Alias for capsense (cap status)",
    category: "led-buttons",
    subcommands: [{ id: "status", name: "status", description: "Button/slider state" }],
  },
  {
    id: "display",
    name: "display",
    description: "Display probe, status, rate (CM55 local when DISPLAY_ENABLE)",
    category: "display",
    subcommands: [
      { id: "probe", name: "probe", description: "Probe panel/touch", params: [{ key: "target", label: "panel | touch", type: "text", required: false, options: ["panel", "touch"] }] },
      { id: "status", name: "status", description: "Display status" },
      { id: "rate", name: "rate", description: "Show or set frame rate (0 = no limit, 1..200 Hz)", params: [{ key: "hz", label: "Rate (Hz)", type: "number", required: false }] },
    ],
  },
  {
    id: "pot",
    name: "pot",
    description: "Potentiometer DAQ (Eval only; CM55 local)",
    category: "sensors",
    subcommands: [
      { id: "daq", name: "daq", description: "Pot DAQ usage" },
      { id: "daq_status", name: "daq status", description: "Pot DAQ status" },
      { id: "daq_rate", name: "daq rate", description: "Pot DAQ rate 1..100 Hz", params: [{ key: "hz", label: "Rate (Hz)", type: "number", required: true }] },
      { id: "daq_enable", name: "daq enable", description: "Enable/disable pot DAQ", params: [{ key: "on_off", label: "On/Off", type: "text", required: true, options: ["on", "off"] }] },
    ],
  },
  {
    id: "sht40",
    name: "sht40",
    description: "SHT40 humidity/temperature DAQ (AI kit only; CM55 local)",
    category: "sensors",
    subcommands: [
      { id: "daq_status", name: "daq status", description: "SHT40 DAQ status" },
      { id: "daq_rate", name: "daq rate", description: "SHT40 DAQ rate 1..10 Hz", params: [{ key: "hz", label: "Rate (Hz)", type: "number", required: true }] },
      { id: "daq_enable", name: "daq enable", description: "Enable/disable SHT40 DAQ", params: [{ key: "on_off", label: "On/Off", type: "text", required: true, options: ["on", "off"] }] },
    ],
  },
  {
    id: "dps368",
    name: "dps368",
    description: "DPS368 pressure/temperature DAQ (AI kit only; CM55 local)",
    category: "sensors",
    subcommands: [
      { id: "daq_status", name: "daq status", description: "DPS368 DAQ status" },
      { id: "daq_rate", name: "daq rate", description: "DPS368 DAQ rate 1..10 Hz", params: [{ key: "hz", label: "Rate (Hz)", type: "number", required: true }] },
      { id: "daq_enable", name: "daq enable", description: "Enable/disable DPS368 DAQ", params: [{ key: "on_off", label: "On/Off", type: "text", required: true, options: ["on", "off"] }] },
    ],
  },
  { id: "mac", name: "mac", description: "Print WiFi MAC address", category: "network" },
  { id: "ip", name: "ip", description: "Print STA IPv4 address", category: "network" },
  { id: "gateway", name: "gateway", description: "Print default gateway IPv4", category: "network" },
  { id: "netmask", name: "netmask", description: "Print STA netmask IPv4", category: "network" },
  {
    id: "ping",
    name: "ping",
    description: "Ping IPv4 host",
    category: "network",
    params: [
      { key: "host", label: "IPv4 address", type: "ip", required: true },
      { key: "timeout_ms", label: "Timeout (ms)", type: "number", required: false, default: "2000" },
    ],
  },
  {
    id: "stacks",
    name: "stacks",
    description: "Task stack high-water marks (bytes free)",
    category: "info",
  },
  {
    id: "wifi",
    name: "wifi",
    description: "WiFi operations",
    category: "wifi",
    subcommands: [
      { id: "scan", name: "scan", description: "Scan networks" },
      { id: "connect", name: "connect", description: "Connect to network", params: [
        { key: "ssid", label: "SSID", type: "text", required: true },
        { key: "pass", label: "Password", type: "text", required: false },
      ] },
      { id: "disconnect", name: "disconnect", description: "Disconnect" },
      { id: "status", name: "status", description: "Status" },
      { id: "list", name: "list", description: "List" },
      { id: "info", name: "info", description: "Info" },
    ],
  },
  {
    id: "udp",
    name: "udp",
    description: "UDP server / send",
    category: "udp",
    subcommands: [
      { id: "start", name: "start", description: "Start" },
      { id: "stop", name: "stop", description: "Stop" },
      {
        id: "send",
        name: "send",
        description: "Send message",
        params: [{ key: "msg", label: "Message", type: "text", required: true }],
      },
      { id: "status", name: "status", description: "Status" },
    ],
  },
  {
    id: "ipc",
    name: "ipc",
    description: "IPC to CM55",
    category: "ipc",
    subcommands: [
      { id: "ping", name: "ping", description: "Ping" },
      {
        id: "send",
        name: "send",
        description: "Send message",
        params: [{ key: "msg", label: "Message", type: "text", required: true }],
      },
      { id: "status", name: "status", description: "Status" },
      { id: "recv", name: "recv", description: "Receive" },
    ],
  },
  {
    id: "imu",
    name: "imu",
    description: "IMU/fusion controls and diagnostics",
    category: "imu",
    subcommands: [
      { id: "status", name: "status", description: "IMU/fusion status (data_hz, stream_hz, daq_on)" },
      { id: "data", name: "data", description: "One fusion sample" },
      { id: "stream_status", name: "stream status", description: "Stream on/off, data_rate, stream_rate" },
      { id: "stream_on", name: "stream on", description: "Stream fusion output to serial" },
      { id: "stream_off", name: "stream off", description: "Stop streaming" },
      {
        id: "stream_rate",
        name: "stream rate",
        description: "Stream rate (Hz); must be ≤ data rate",
        params: [{ key: "hz", label: "Stream rate (Hz)", type: "number", required: true }],
      },
      { id: "stream_quat_on", name: "stream quat on", description: "Enable printing [CM33.FUSION.DATA] quaternion line to serial" },
      { id: "stream_quat_off", name: "stream quat off", description: "Disable printing [CM33.FUSION.DATA] quaternion line to serial" },
      { id: "sample_status", name: "sample status", description: "Stream rate and data rate (read-only)" },
      { id: "daq_status", name: "daq status", description: "Last DAQ config: rate (Hz), enabled" },
      {
        id: "daq_rate",
        name: "daq rate",
        description: "Data rate 1..100 Hz (IMU samples from CM55)",
        params: [{ key: "hz", label: "Rate (Hz)", type: "number", required: true }],
      },
      {
        id: "daq_enable",
        name: "daq enable",
        description: "Enable or pause IMU DAQ on CM55",
        params: [{
          key: "on_off",
          label: "On/Off",
          type: "text",
          required: true,
          options: ["on", "off"],
        }],
      },
      { id: "fusion_status", name: "fusion status", description: "Fusion status" },
      {
        id: "fusion_mode",
        name: "fusion mode",
        description: "Fusion mode (quat, euler, or data)",
        params: [{
          key: "mode",
          label: "Mode",
          type: "text",
          required: true,
          default: "quat",
          options: ["quat", "euler", "data"],
        }],
      },
      { id: "fusion_on", name: "fusion on", description: "Fusion on" },
      { id: "fusion_off", name: "fusion off", description: "Fusion off" },
      { id: "calib_status", name: "calib status", description: "Calibration status" },
      { id: "calib_reset", name: "calib reset", description: "Calibration reset" },
      { id: "swap_status", name: "swap status", description: "YZ swap status" },
      { id: "swap_on", name: "swap on", description: "YZ swap on" },
      { id: "swap_off", name: "swap off", description: "YZ swap off" },
      { id: "help", name: "help", description: "IMU command help" },
    ],
  },
  {
    id: "mag",
    name: "mag",
    description: "Magnetometer (BMM350) DAQ and stream",
    category: "mag",
    subcommands: [
      { id: "daq_status", name: "daq status", description: "Last mag DAQ config: rate (Hz), enabled" },
      {
        id: "daq_rate",
        name: "daq rate",
        description: "Mag DAQ rate 1..10 Hz",
        params: [{ key: "hz", label: "Rate (Hz)", type: "number", required: true }],
      },
      {
        id: "daq_enable",
        name: "daq enable",
        description: "Enable or pause mag DAQ on CM55",
        params: [{
          key: "on_off",
          label: "On/Off",
          type: "text",
          required: true,
          options: ["on", "off"],
        }],
      },
      { id: "stream_on", name: "stream on", description: "Print [CM55.BMM350.DATA] lines to serial" },
      { id: "stream_off", name: "stream off", description: "Stop printing mag lines to serial" },
    ],
  },
  {
    id: "touch",
    name: "touch",
    description: "Touch IPC mode (status, on_change, continuous)",
    category: "touch",
    subcommands: [
      { id: "ipc_mode_status", name: "ipc mode status", description: "Touch IPC mode status" },
      { id: "ipc_mode_on_change", name: "ipc mode on_change", description: "Touch IPC mode on_change" },
      { id: "ipc_mode_continuous", name: "ipc mode continuous", description: "Touch IPC mode continuous" },
    ],
  },
  {
    id: "reset",
    name: "reset",
    description: "Software reset (like reset button)",
    category: "destructive",
    destructive: true,
  },
  {
    id: "reboot",
    name: "reboot",
    description: "Reboot (same as reset)",
    category: "destructive",
    destructive: true,
  },
];

export function getCommandsByCategory(): Map<CliCategoryId, CliCommand[]> {
  const map = new Map<CliCategoryId, CliCommand[]>();
  for (const cat of CLI_CATEGORIES) {
    map.set(cat.id, CLI_COMMANDS.filter((c) => c.category === cat.id));
  }
  return map;
}

export function getCommand(id: string): CliCommand | undefined {
  return CLI_COMMANDS.find((c) => c.id === id);
}

export function getSubcommand(cmd: CliCommand, subId: string): CliSubcommand | undefined {
  return cmd.subcommands?.find((s) => s.id === subId);
}

/** Get params for the current command + subcommand selection. */
export function getParamsForCommand(
  cmd: CliCommand,
  subcommandId: string | null
): CliParam[] | undefined {
  if (subcommandId) {
    const sub = getSubcommand(cmd, subcommandId);
    if (sub?.params?.length) return sub.params;
  }
  return cmd.params;
}

/**
 * Build the CLI line to send: "command [subcommand...] [arg1] [arg2] ..."
 * Subcommand name may contain spaces (e.g. "fusion mode") and is split into tokens.
 */
export function buildCommandLine(
  cmdId: string,
  subcommandId: string | null,
  params: Record<string, string>
): string {
  const cmd = getCommand(cmdId);
  if (!cmd) return "";

  const parts: string[] = [cmd.name];
  if (subcommandId) {
    const sub = getSubcommand(cmd, subcommandId);
    if (sub) {
      parts.push(...sub.name.split(" ").filter(Boolean));
    } else {
      parts.push(subcommandId);
    }
  }

  const paramList = getParamsForCommand(cmd, subcommandId);
  if (paramList) {
    for (const p of paramList) {
      const v = params[p.key]?.trim();
      if (v !== undefined && v !== "") parts.push(v);
      else if (p.required) parts.push(p.default ?? "");
    }
  }

  return parts.join(" ").trim();
}
