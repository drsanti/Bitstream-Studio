import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { updateTwinMaintenanceAlerts } from "./animation-lab-twin-alerts.js";
import {
  buildAnimationLabTwinExportReport,
  serializeAnimationLabTwinExportReport,
} from "./animation-lab-twin-export.js";
import {
  appendTwinTrendSamples,
  readTwinTrendSamples,
} from "./animation-lab-twin-trends.js";
import { writeClipboardText } from "../../../ui/utils/clipboard.js";
import {
  applyAnimationLabTwinMappingOverrides,
  resolveTwinCardPrimarySignalKey,
} from "./animation-lab-twin-mapping.apply.js";
import { useAnimationLabTwinMappingStore } from "./animation-lab-twin-mapping.store.js";
import { useAnimationLabTwinTagStyleStore } from "./animation-lab-twin-tag-style.store.js";
import {
  resolveTwinTagStyle,
  type AnimationLabTwinTagComponentStyle,
  type AnimationLabTwinTagGlobalStyle,
} from "./animation-lab-twin-tag-style.types.js";
import { resolveAnimationLabActionKey } from "./animation-lab-action-key.js";
import { resolveAnimationLabDigitalTwin } from "./parse-animation-lab-digital-twin.js";
import { twinDataSourceCaptionLocalized } from "./animation-lab-twin-i18n.js";
import { localizeTwinComponentsLive } from "./animation-lab-twin-localize.js";
import { useAnimationLabTwinLocaleStore } from "./animation-lab-twin-locale.store.js";
import {
  isAnimationLabTwinLiveTelemetryActive,
  mergeAnimationLabTwinWithLive,
} from "./animation-lab-twin-live.js";
import { runAnimationLabTwinSimulator } from "./animation-lab-twin-simulator.js";
import type {
  AnimationLabDigitalTwinDef,
  AnimationLabTwinAlert,
  AnimationLabTwinComponentLive,
  AnimationLabTwinDataSource,
  AnimationLabTwinExportReport,
  AnimationLabTwinHealth,
  AnimationLabTwinMachineSummary,
  AnimationLabTwinTrendKey,
} from "./digital-twin.types.js";
import { useGlbAnimationLab } from "./glb-animation-lab-context.js";
import { useBitstreamConnectionStore } from "../../state/bitstreamConnection.store.js";
import { useBitstreamLiveStore } from "../../state/bitstreamLive.store.js";

export type GlbAnimationLabTwinContextValue = {
  twin: AnimationLabDigitalTwinDef | null;
  components: AnimationLabTwinComponentLive[];
  summary: AnimationLabTwinMachineSummary | null;
  selectedComponentId: string | null;
  setSelectedComponentId: (id: string | null) => void;
  selectComponent: (id: string) => void;
  dataSource: AnimationLabTwinDataSource;
  dataSourceCaption: string;
  alerts: AnimationLabTwinAlert[];
  activeAlertCount: number;
  trendSamples: Record<AnimationLabTwinTrendKey, number[]>;
  readTrendSamples: (componentId: string, signalKey: string) => readonly number[];
  exportReport: () => AnimationLabTwinExportReport | null;
  copyMaintenanceReport: () => Promise<boolean>;
  tagStyleGlobal: AnimationLabTwinTagGlobalStyle;
  tagStylesByComponent: Record<string, AnimationLabTwinTagComponentStyle>;
  mappingCardPrimaryByComponent: Record<string, string>;
  resolveTagStyle: (componentId: string, componentLabel: string) => ReturnType<typeof resolveTwinTagStyle>;
  resolveCardPrimarySignal: (
    componentId: string,
    signals: AnimationLabTwinComponentLive["signals"],
  ) => AnimationLabTwinComponentLive["signals"][number] | undefined;
  patchTagStyleGlobal: (patch: Partial<AnimationLabTwinTagGlobalStyle>) => void;
  patchTagStyle: (componentId: string, patch: Partial<AnimationLabTwinTagComponentStyle>) => void;
  resetTagStyle: (componentId: string) => void;
  resetAllTagStyles: () => void;
};

const GlbAnimationLabTwinContext = createContext<GlbAnimationLabTwinContextValue | null>(null);

const TWIN_TICK_MS = 1000;

export function GlbAnimationLabTwinProvider(props: { children: ReactNode }) {
  const lab = useGlbAnimationLab();
  const clipNames = lab?.runtime.clipNames ?? [];
  const dedupeKey = lab?.dedupeKey ?? "";
  const loadMappingScope = useAnimationLabTwinMappingStore((s) => s.loadScope);
  const mappingSignalLiveSourceByKey = useAnimationLabTwinMappingStore((s) => s.signalLiveSourceByKey);
  const mappingCardPrimaryByComponent = useAnimationLabTwinMappingStore((s) => s.cardPrimaryByComponent);
  const loadTagStyleScope = useAnimationLabTwinTagStyleStore((s) => s.loadScope);
  const tagStyleGlobal = useAnimationLabTwinTagStyleStore((s) => s.global);
  const tagStylesByComponent = useAnimationLabTwinTagStyleStore((s) => s.byComponent);
  const patchTagStyleGlobal = useAnimationLabTwinTagStyleStore((s) => s.patchGlobal);
  const patchTagStyle = useAnimationLabTwinTagStyleStore((s) => s.patchComponent);
  const resetTagStyle = useAnimationLabTwinTagStyleStore((s) => s.resetComponent);
  const resetAllTagStyles = useAnimationLabTwinTagStyleStore((s) => s.resetAll);
  const locale = useAnimationLabTwinLocaleStore((s) => s.locale);
  const hydrateTwinLocale = useAnimationLabTwinLocaleStore((s) => s.hydrate);

  useEffect(() => {
    hydrateTwinLocale();
  }, [hydrateTwinLocale]);

  const twin = useMemo(
    () =>
      dedupeKey.length > 0 && clipNames.length > 0
        ? resolveAnimationLabDigitalTwin({ dedupeKey, clipNames })
        : null,
    [clipNames, dedupeKey],
  );

  const [nowMs, setNowMs] = useState(() => Date.now());
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [trendSamples, setTrendSamples] = useState<Record<AnimationLabTwinTrendKey, number[]>>({});
  const [alerts, setAlerts] = useState<AnimationLabTwinAlert[]>([]);
  const prevSignalHealthRef = useRef<Map<string, AnimationLabTwinHealth>>(new Map());

  const connected = useBitstreamConnectionStore((s) => s.connected);
  const handshakeState = useBitstreamLiveStore((s) => s.handshakeState);
  const latestByHint = useBitstreamLiveStore((s) => s.latestByHint);
  const lastAtByHint = useBitstreamLiveStore((s) => s.lastAtByHint);
  const bs2EvtSensorLastRxAtMs = useBitstreamLiveStore((s) => s.bs2EvtSensorLastRxAtMs);
  const firmwareLastRxAtMs = useBitstreamLiveStore((s) => s.firmwareLastRxAtMs);

  const tagStyleScopeKey = useMemo(() => {
    if (twin?.assetId != null && twin.assetId.length > 0) {
      return twin.assetId;
    }
    return dedupeKey.length > 0 ? dedupeKey : "default";
  }, [dedupeKey, twin?.assetId]);

  useEffect(() => {
    loadTagStyleScope(tagStyleScopeKey);
    loadMappingScope(tagStyleScopeKey);
  }, [loadMappingScope, loadTagStyleScope, tagStyleScopeKey]);

  const effectiveTwin = useMemo(() => {
    if (twin == null) {
      return null;
    }
    return applyAnimationLabTwinMappingOverrides(twin, {
      signalLiveSourceByKey: mappingSignalLiveSourceByKey,
      cardPrimaryByComponent: mappingCardPrimaryByComponent,
    });
  }, [mappingCardPrimaryByComponent, mappingSignalLiveSourceByKey, twin]);

  useEffect(() => {
    if (twin == null) {
      return;
    }
    const id = window.setInterval(() => setNowMs(Date.now()), TWIN_TICK_MS);
    return () => window.clearInterval(id);
  }, [twin]);

  const resolveTagStyleForComponent = useCallback(
    (componentId: string, componentLabel: string) =>
      resolveTwinTagStyle(componentLabel, tagStyleGlobal, tagStylesByComponent[componentId]),
    [tagStyleGlobal, tagStylesByComponent],
  );

  const resolveCardPrimarySignal = useCallback(
    (componentId: string, signals: AnimationLabTwinComponentLive["signals"]) => {
      const def = effectiveTwin?.components.find((c) => c.id === componentId);
      const primaryKey = resolveTwinCardPrimarySignalKey(
        componentId,
        signals.map((s) => s.key),
        {
          metadataPrimaryKey: def?.cardPrimarySignalKey,
          cardPrimaryByComponent: mappingCardPrimaryByComponent,
        },
      );
      return signals.find((s) => s.key === primaryKey) ?? signals[0];
    },
    [effectiveTwin?.components, mappingCardPrimaryByComponent],
  );

  const simulated = useMemo(() => {
    if (effectiveTwin == null || lab == null) {
      return null;
    }
    return runAnimationLabTwinSimulator({
      twin: effectiveTwin,
      nowMs,
      playbackMode: lab.playbackMode,
      activeClipName: lab.activeClipName,
      transport: lab.transport,
    });
  }, [effectiveTwin, lab, nowMs]);

  const liveActive = useMemo(
    () =>
      isAnimationLabTwinLiveTelemetryActive({
        connected,
        handshakeState,
        bs2EvtSensorLastRxAtMs,
        firmwareLastRxAtMs,
        nowMs,
      }),
    [bs2EvtSensorLastRxAtMs, connected, firmwareLastRxAtMs, handshakeState, nowMs],
  );

  const merged = useMemo(() => {
    if (effectiveTwin == null || simulated == null) {
      return null;
    }
    return mergeAnimationLabTwinWithLive({
      twin: effectiveTwin,
      simulated,
      latestByHint,
      lastAtByHint,
      nowMs,
      liveActive,
    });
  }, [effectiveTwin, lastAtByHint, latestByHint, liveActive, nowMs, simulated]);

  useEffect(() => {
    setTrendSamples({});
    setAlerts([]);
    prevSignalHealthRef.current = new Map();
  }, [dedupeKey]);

  useEffect(() => {
    if (merged == null || twin == null) {
      return;
    }
    setTrendSamples((prev) => appendTwinTrendSamples(prev, merged.components));
    setAlerts((prevAlerts) => {
      const alertUpdate = updateTwinMaintenanceAlerts({
        prevAlerts,
        prevHealth: prevSignalHealthRef.current,
        components: merged.components,
        assetId: twin.assetId,
        nowMs,
        locale,
      });
      prevSignalHealthRef.current = alertUpdate.health;
      return alertUpdate.alerts;
    });
  }, [locale, merged, nowMs, twin]);

  const displayComponents = useMemo(() => {
    if (effectiveTwin == null || merged == null) {
      return [];
    }
    return localizeTwinComponentsLive(effectiveTwin, merged.components, locale);
  }, [effectiveTwin, locale, merged]);

  const readTrendSamples = useCallback(
    (componentId: string, signalKey: string) => readTwinTrendSamples(trendSamples, componentId, signalKey),
    [trendSamples],
  );

  const exportReport = useCallback((): AnimationLabTwinExportReport | null => {
    if (effectiveTwin == null || merged == null) {
      return null;
    }
    return buildAnimationLabTwinExportReport({
      twin: effectiveTwin,
      summary: merged.summary,
      components: merged.components,
      dataSource: merged.dataSource,
      alerts,
      trends: trendSamples,
      exportedAtMs: Date.now(),
    });
  }, [alerts, effectiveTwin, merged, trendSamples]);

  const copyMaintenanceReport = useCallback(async (): Promise<boolean> => {
    const report = exportReport();
    if (report == null) {
      return false;
    }
    return writeClipboardText(serializeAnimationLabTwinExportReport(report));
  }, [exportReport]);

  const activeAlertCount = useMemo(
    () => alerts.filter((a) => a.clearedAtMs == null).length,
    [alerts],
  );

  const selectComponent = useCallback(
    (id: string) => {
      setSelectedComponentId(id);
      if (lab == null || twin == null) {
        return;
      }
      const component = twin.components.find((c) => c.id === id);
      if (component?.glbAnchor == null) {
        return;
      }
      const clipKey =
        resolveAnimationLabActionKey(new Set(lab.runtime.clipNames), component.glbAnchor) ??
        component.glbAnchor;
      lab.setActiveClipName(clipKey);
      lab.setTransport("stopped");
      lab.setScrubTimeS(0);
    },
    [lab, twin],
  );

  useEffect(() => {
    if (lab == null || twin == null || lab.activeClipName == null) {
      return;
    }
    const match = twin.components.find((c) => {
      if (c.glbAnchor == null) {
        return false;
      }
      const key =
        resolveAnimationLabActionKey(new Set(lab.runtime.clipNames), c.glbAnchor) ?? c.glbAnchor;
      const active =
        resolveAnimationLabActionKey(new Set(lab.runtime.clipNames), lab.activeClipName) ??
        lab.activeClipName;
      return key === active;
    });
    if (match != null) {
      setSelectedComponentId(match.id);
    }
  }, [lab?.activeClipName, lab?.runtime.clipNames, twin]);

  const value = useMemo((): GlbAnimationLabTwinContextValue => {
    if (twin == null || merged == null) {
      return {
        twin: null,
        components: [],
        summary: null,
        selectedComponentId: null,
        setSelectedComponentId,
        selectComponent,
        dataSource: "simulated",
        dataSourceCaption: twinDataSourceCaptionLocalized("simulated", locale),
        alerts: [],
        activeAlertCount: 0,
        trendSamples: {},
        readTrendSamples: () => [],
        exportReport: () => null,
        copyMaintenanceReport: async () => false,
        tagStyleGlobal: {},
        tagStylesByComponent: {},
        mappingCardPrimaryByComponent: {},
        resolveTagStyle: (componentId, componentLabel) =>
          resolveTwinTagStyle(componentLabel, undefined, undefined),
        resolveCardPrimarySignal: () => undefined,
        patchTagStyleGlobal,
        patchTagStyle,
        resetTagStyle,
        resetAllTagStyles,
      };
    }
    return {
      twin,
      components: displayComponents,
      summary: merged.summary,
      selectedComponentId,
      setSelectedComponentId,
      selectComponent,
      dataSource: merged.dataSource,
      dataSourceCaption: twinDataSourceCaptionLocalized(merged.dataSource, locale),
      alerts,
      activeAlertCount,
      trendSamples,
      readTrendSamples,
      exportReport,
      copyMaintenanceReport,
      tagStyleGlobal,
      tagStylesByComponent,
      mappingCardPrimaryByComponent,
      resolveTagStyle: resolveTagStyleForComponent,
      resolveCardPrimarySignal,
      patchTagStyleGlobal,
      patchTagStyle,
      resetTagStyle,
      resetAllTagStyles,
    };
  }, [
    activeAlertCount,
    alerts,
    copyMaintenanceReport,
    displayComponents,
    exportReport,
    locale,
    merged,
    patchTagStyle,
    patchTagStyleGlobal,
    readTrendSamples,
    resetAllTagStyles,
    resetTagStyle,
    mappingCardPrimaryByComponent,
    resolveCardPrimarySignal,
    resolveTagStyleForComponent,
    selectComponent,
    selectedComponentId,
    tagStyleGlobal,
    tagStylesByComponent,
    trendSamples,
    twin,
  ]);

  return (
    <GlbAnimationLabTwinContext.Provider value={value}>
      {props.children}
    </GlbAnimationLabTwinContext.Provider>
  );
}

export function useGlbAnimationLabTwin(): GlbAnimationLabTwinContextValue | null {
  return useContext(GlbAnimationLabTwinContext);
}
