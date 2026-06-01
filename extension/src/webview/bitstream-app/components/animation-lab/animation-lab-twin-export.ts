import type {
  AnimationLabDigitalTwinDef,
  AnimationLabTwinAlert,
  AnimationLabTwinComponentLive,
  AnimationLabTwinDataSource,
  AnimationLabTwinExportReport,
  AnimationLabTwinMachineSummary,
  AnimationLabTwinTrendKey,
} from "./digital-twin.types.js";

export function buildAnimationLabTwinExportReport(args: {
  twin: AnimationLabDigitalTwinDef;
  summary: AnimationLabTwinMachineSummary;
  components: readonly AnimationLabTwinComponentLive[];
  dataSource: AnimationLabTwinDataSource;
  alerts: readonly AnimationLabTwinAlert[];
  trends: Record<AnimationLabTwinTrendKey, number[]>;
  exportedAtMs: number;
}): AnimationLabTwinExportReport {
  return {
    schema: "bitstream.animation-lab.twin-report",
    version: 1,
    exportedAtMs: args.exportedAtMs,
    assetId: args.twin.assetId,
    assetLabel: args.twin.label,
    dataSource: args.dataSource,
    summary: args.summary,
    components: [...args.components],
    alerts: [...args.alerts],
    trends: { ...args.trends },
  };
}

export function serializeAnimationLabTwinExportReport(report: AnimationLabTwinExportReport): string {
  return JSON.stringify(report, null, 2);
}
