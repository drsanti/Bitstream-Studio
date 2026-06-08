import { usePresentationSht40 } from "../../../../app/usePresentationSensor";
import { classifySht40Comfort } from "../../../../core/sht40-comfort";
import { DemoSlideLayout } from "../../../_shared/layouts/DemoSlideLayout";
import { LiveBar } from "../../../../widgets/LiveBar";
import { ComfortZoneSvg } from "../../../_shared/visual/diagrams/ComfortZoneSvg";
import {
  PresentationSceneLiveOverlay,
  PresentationSceneParamRow,
} from "../../../../widgets/r3f/PresentationSceneLiveOverlay";

const ZONE_COLOR: Record<string, string> = {
  Comfortable: "var(--accent-cyan)",
  "Too humid": "var(--accent-purple)",
  "Too dry": "var(--accent-amber)",
  "Too warm": "var(--accent-red)",
  "Too cool": "var(--axis-z)",
  Unknown: "var(--text-muted)",
};

export default function ShtDemoComfortSlide() {
  const frame = usePresentationSht40();
  const valid = frame.tempValid && frame.rhValid;
  const zone = valid ? classifySht40Comfort(frame.temp, frame.rh) : "Unknown";
  const zoneColor = ZONE_COLOR[zone] ?? "var(--text-muted)";

  const hud = (
    <PresentationSceneLiveOverlay title="Live point">
      <div className="presentation-scene-param-grid presentation-scene-param-grid--single">
        <PresentationSceneParamRow label="T" value={valid ? frame.temp : NaN} decimals={1} unit="°C" color="var(--accent-amber)" />
        <PresentationSceneParamRow label="RH" value={valid ? frame.rh : NaN} decimals={1} unit="%" color="var(--accent-cyan)" />
        <div className="presentation-scene-param-chip">
          <span className="presentation-scene-param-chip__label">zone</span>
          <span className="presentation-scene-param-chip__value" style={{ color: zoneColor }}>
            {zone}
          </span>
        </div>
      </div>
    </PresentationSceneLiveOverlay>
  );

  return (
    <DemoSlideLayout
      layout="demo-rail"
      title="Comfort classifier"
      subtitle="Teaching thresholds on live T and %RH — not a building automation controller."
      theoryStrip="Marker on the chart tracks the live sample; discuss HVAC setpoints vs this simplified band."
      footer={valid ? `Classified: ${zone}` : "Publish TEMP + HUM on SHT40"}
      scene={
        <div className="relative flex h-full w-full min-h-0 items-center justify-center bg-[var(--scene-bg)] p-6">
          <div className="h-full w-full max-w-lg">
            <ComfortZoneSvg tempC={frame.temp} rhPct={frame.rh} showMarker={valid} />
          </div>
          <div className="presentation-scene-overlay-layer">{hud}</div>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <LiveBar label="Temperature" value={valid ? frame.temp : 0} min={10} max={35} color="var(--accent-amber)" showValue unit="°C" decimals={1} />
        <LiveBar label="Humidity" value={valid ? frame.rh : 0} min={0} max={100} color="var(--accent-cyan)" showValue unit="%" decimals={1} />
        <p className="text-sm text-[var(--text-secondary)]">
          Lab: exhale near sensor (RH up), ice pack nearby (T down) — predict zone before looking at the classifier.
        </p>
      </div>
    </DemoSlideLayout>
  );
}
