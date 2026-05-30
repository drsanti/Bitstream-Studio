export type MonitorToolId =
  | "control"
  | "matrix"
  | "probe"
  | "ratecheck"
  | "sim"
  | "injector"
  | "mock";

export type ToolLogTone = "info" | "cmd" | "pass" | "fail" | "warn";

export type ToolLogLine = {
  id: string;
  atMs: number;
  text: string;
  tone: ToolLogTone;
};

export type CaseRunStatus = "idle" | "running" | "pass" | "fail" | "skip";
