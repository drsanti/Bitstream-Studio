# CM55 CLI Commands — List for UI Design

This document lists all CLI commands so each can be mapped to a UI action or screen. The CLI runs on **CM55** (UART prompt and line input). Many commands run locally on CM55 (imu daq, mag daq, pot, sht40, dps368, display, led, stats, capsense); the rest are forwarded to CM33 via IPC.

Source: TESAIoT_Library CM55/modules/cm55_cli [CLI_COMMANDS_LIST.md](D:\CODE\2026\TESAIoT_PSoC_Edge_Workspace\TESAIoT_Library\CM55\modules\cm55_cli\CLI_COMMANDS_LIST.md) and [CLI_CM55_COMMANDS.md](D:\CODE\2026\TESAIoT_PSoC_Edge_Workspace\TESAIoT_Library\CM55\modules\cm55_cli\CLI_CM55_COMMANDS.md). Commands are case-sensitive.

## Top-level commands (no subcommand)

| Command   | Description |
| --------- | ------------ |
| help      | List commands and short help |
| version   | Firmware/CLI version string |
| clear     | Clear the terminal screen |
| echo      | Echo arguments to output |
| uptime    | Print time since boot (seconds) |
| heap      | Print FreeRTOS heap free (bytes) |
| date      | Print current date (YYYY-MM-DD) |
| sysinfo   | System snapshot (uptime, heap, time, tasks) |
| log       | Print log transport info; use **log status** or **log level** for details |
| tasks     | List FreeRTOS tasks |
| stacks    | Task stack high-water marks (bytes free) |
| stats     | _(CM55 local)_ CM55 idle % (when run-time stats enabled) |
| buttons   | Requires **buttons status** (see below) |
| mac       | Print WiFi MAC address |
| ip        | Print STA IPv4 address |
| gateway   | Print default gateway IPv4 |
| netmask   | Print STA netmask IPv4 |
| ping      | **ping** \<a.b.c.d\> [timeout_ms] |
| reset     | Software reset (like reset button) |
| reboot    | Reboot (same as reset) |

## led (CM55 local: user LEDs red/green/blue)

- **led** on | off | toggle — all LEDs
- **led** red | green | blue | all **on** | **off** | **toggle**

_(If forwarded to CM33, **led** on|off|toggle controls the single BSP user LED on CM33.)_

## capsense (CM55 local; when CAPSENSE_ENABLE=1)

- **capsense status** | **cap status** — print button/slider state (buttonstatus1, buttoncount, slider)

## display (CM55 local only; when DISPLAY_ENABLE=1)

- **display** — usage
- **display** probe [panel|touch]
- **display** status
- **display** rate — show current frame rate (Hz); 0 = no limit
- **display** rate \<hz\> — set target frame rate (0 = no limit, 1..200 Hz)

## time

- **time** — print current date/time (full format)
- **time** now | full | date | clock | set \<hour min sec day month year\> | sync | ntp

## log

- **log** — show current log level
- **log** status
- **log** level \<none|error|warn|info|debug|verbose\>

## buttons

- **buttons** status

## imu

(On CM55 prompt: **imu daq** and its subcommands run locally on CM55. All other **imu** subcommands run on CM33 via IPC.)

- **imu** help | daq (status|rate \<hz\>|enable on|off) | status | data | stream (status|rate|on|off|quat on|off) | swap (status|on|off) | fusion (status|mode quat|euler|data|on|off) | sample status | calib (status|reset)
- **imu daq rate** \<hz\>: 1..**100** Hz (IMU samples from CM55)

## mag

(On CM55 prompt: **mag daq** (status, rate, enable) runs locally on CM55. **mag stream** runs on CM33 via IPC.)

- **mag** help | daq status | daq rate \<hz\> (1..10 Hz) | daq enable on|off | stream on|off

## pot (Eval only; local on CM55)

- **pot** daq | daq status | daq rate \<hz\> (1..100) | daq enable on|off

## sht40 (AI kit only; local on CM55)

- **sht40** daq status | daq rate \<hz\> (1..10) | daq enable on|off

## dps368 (AI kit only; local on CM55)

- **dps368** daq status | daq rate \<hz\> (1..10) | daq enable on|off

## touch (IPC mode)

- **touch** ipc mode status | **touch** ipc mode on_change | **touch** ipc mode continuous

## wifi

- **wifi** scan | connect \<ssid\> [pass] | disconnect | status | list | info

## udp

- **udp** start | stop | send \<msg\> | status

## ipc

- **ipc** ping | send \<msg\> | status | recv

## UI hints

- **Info only (no arguments, single action)**  
  help, version, clear, uptime, heap, date, sysinfo, log status, tasks, stats, mac, ip, gateway, netmask, stacks — one button or menu item that runs the command and shows output.

- **Subcommand picker**  
  time, buttons, led (on/off/toggle and red|green|blue|all on|off|toggle), display (probe, status, rate), log (status, level), imu, touch (ipc mode only), mag, pot, sht40, dps368, capsense/cap, wifi, udp, ipc.

- **Text or numeric inputs**
  - **echo**: optional text field.
  - **time set**: six number inputs (hour, min, sec, day, month, year).
  - **ping**: IPv4 address (required), timeout_ms (optional, default 2000).
  - **log level**: enum picker (none|error|warn|info|debug|verbose).
  - **wifi connect**: SSID (required), password (optional).
  - **udp send**, **ipc send**: message text (required).
  - **imu daq rate** \<hz\>: 1..**100** Hz; **imu daq enable** on|off; **imu stream rate** \<hz\>; **imu stream quat** on|off; **imu fusion mode** quat|euler|data.
  - **mag daq rate** (1..10 Hz); **mag daq enable** on|off.
  - **pot daq rate** (1..100 Hz); **pot daq enable** on|off.
  - **sht40 daq rate** (1..10 Hz); **sht40 daq enable** on|off.
  - **dps368 daq rate** (1..10 Hz); **dps368 daq enable** on|off.
  - **display** probe [panel|touch]; **display rate** [hz] (0 or 1..200).

- **Destructive (confirm before run)**  
  reset, reboot — show a confirmation dialog before executing.
