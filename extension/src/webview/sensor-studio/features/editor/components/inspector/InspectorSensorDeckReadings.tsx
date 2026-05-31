import {
  Bmi270FusionEulerDataView,
  Bmi270FusionQuaternionDataView,
  Bmi270RawAccelDataView,
  Bmi270RawGyroDataView,
  Bmi270RawTemperatureDataView,
} from "../../../../../bitstream-app/components/bmi270/Bmi270RawDataViews";
import { BMM350DataViewer } from "../../../../../bitstream-app/components/bmm350/BMM350DataViewer";
import { BMM350TemperatureDataViewer } from "../../../../../bitstream-app/components/bmm350/BMM350TemperatureDataViewer";
import { DPS368DataViewer } from "../../../../../bitstream-app/components/dps368/DPS368DataViewer";
import { DPS368TemperatureDataViewer } from "../../../../../bitstream-app/components/dps368/DPS368TemperatureDataViewer";
import { SHT40DataViewer } from "../../../../../bitstream-app/components/sht40/SHT40DataViewer";
import { useBitstreamConfigStore } from "../../../../../bitstream-app/state/bitstreamConfig.store";
import type { Bmi270LiveSample } from "../../../../../bitstream-app/types/bitstreamWorkspaceTypes";
import type { StudioNode } from "../../store/flow-editor.store";
import { isStudioSensorTapNodeId } from "../../store/flow-editor.store";
import { useInspectorLiveDeckSamples } from "./useInspectorLiveDeckSamples";

export type InspectorSensorDeckReadingsProps = {
  selectedNode: StudioNode;
};

type DeckFrameProps = {
  sample: Bmi270LiveSample | null;
  samplingIntervalMs: number;
};

function Bmi270GyroDeckCard(props: DeckFrameProps) {
  return (
    <Bmi270RawGyroDataView
      sample={props.sample ?? ({} as Bmi270LiveSample)}
      samplingIntervalMs={props.samplingIntervalMs}
    />
  );
}

function Bmi270AccelDeckCard(props: DeckFrameProps) {
  return (
    <Bmi270RawAccelDataView
      sample={props.sample ?? ({} as Bmi270LiveSample)}
      samplingIntervalMs={props.samplingIntervalMs}
    />
  );
}

function Bmi270TempDeckCard(props: DeckFrameProps) {
  return (
    <Bmi270RawTemperatureDataView
      sample={props.sample ?? ({} as Bmi270LiveSample)}
      samplingIntervalMs={props.samplingIntervalMs}
    />
  );
}

function Bmi270QuatDeckCard(props: DeckFrameProps) {
  return (
    <Bmi270FusionQuaternionDataView
      sample={props.sample ?? ({} as Bmi270LiveSample)}
      samplingIntervalMs={props.samplingIntervalMs}
    />
  );
}

function Bmi270EulerDeckCard(props: DeckFrameProps) {
  return (
    <Bmi270FusionEulerDataView
      sample={props.sample ?? ({} as Bmi270LiveSample)}
      samplingIntervalMs={props.samplingIntervalMs}
    />
  );
}

/**
 * Node Inspector **Live readings** — reuses Telemetry Data deck cards (`TRNInteractiveCard` +
 * `Bmi270RawSection` / `*DataViewer`) so values, units, gauges, and Δms badges match the deck.
 */
export function InspectorSensorDeckReadings(props: InspectorSensorDeckReadingsProps) {
  const { selectedNode } = props;
  const nodeId = selectedNode.data.nodeId;
  const deck = useInspectorLiveDeckSamples();
  const bmi270StreamMode = useBitstreamConfigStore((s) => s.bmi270StreamMode);

  const bmi270Frame: DeckFrameProps = {
    sample: deck.bmi270,
    samplingIntervalMs: deck.samplingIntervalMs.bmi270,
  };

  if (nodeId === "bmi270-input") {
    const showRaw = bmi270StreamMode !== "fusion";
    const showFusion = bmi270StreamMode !== "raw";
    return (
      <div className="flex flex-col gap-2">
        {showRaw ? (
          <>
            <Bmi270GyroDeckCard {...bmi270Frame} />
            <Bmi270AccelDeckCard {...bmi270Frame} />
            <Bmi270TempDeckCard {...bmi270Frame} />
          </>
        ) : null}
        {showFusion ? (
          <>
            <Bmi270QuatDeckCard {...bmi270Frame} />
            <Bmi270EulerDeckCard {...bmi270Frame} />
          </>
        ) : null}
      </div>
    );
  }

  if (nodeId === "bmi270-tap-gyro") {
    return <Bmi270GyroDeckCard {...bmi270Frame} />;
  }
  if (nodeId === "bmi270-tap-accel") {
    return <Bmi270AccelDeckCard {...bmi270Frame} />;
  }
  if (nodeId === "bmi270-tap-quaternion") {
    return <Bmi270QuatDeckCard {...bmi270Frame} />;
  }
  if (nodeId === "bmi270-tap-euler") {
    return <Bmi270EulerDeckCard {...bmi270Frame} />;
  }

  if (nodeId === "bmm350-input") {
    return (
      <div className="flex flex-col gap-2">
        <BMM350DataViewer
          sample={deck.bmm350}
          samplingIntervalMs={deck.samplingIntervalMs.bmm350}
        />
        <BMM350TemperatureDataViewer
          sample={deck.bmm350}
          samplingIntervalMs={deck.samplingIntervalMs.bmm350}
        />
      </div>
    );
  }
  if (nodeId === "bmm350-tap-magnetic") {
    return (
      <BMM350DataViewer
        sample={deck.bmm350}
        samplingIntervalMs={deck.samplingIntervalMs.bmm350}
      />
    );
  }
  if (nodeId === "bmm350-tap-temp") {
    return (
      <BMM350TemperatureDataViewer
        sample={deck.bmm350}
        samplingIntervalMs={deck.samplingIntervalMs.bmm350}
      />
    );
  }

  if (nodeId === "dps368-input") {
    return (
      <div className="flex flex-col gap-2">
        <DPS368DataViewer
          sample={deck.dps368}
          samplingIntervalMs={deck.samplingIntervalMs.dps368}
        />
        <DPS368TemperatureDataViewer
          sample={deck.dps368}
          samplingIntervalMs={deck.samplingIntervalMs.dps368}
        />
      </div>
    );
  }
  if (nodeId === "dps368-tap-pressure") {
    return (
      <DPS368DataViewer
        sample={deck.dps368}
        samplingIntervalMs={deck.samplingIntervalMs.dps368}
      />
    );
  }
  if (nodeId === "dps368-tap-temp") {
    return (
      <DPS368TemperatureDataViewer
        sample={deck.dps368}
        samplingIntervalMs={deck.samplingIntervalMs.dps368}
      />
    );
  }

  if (nodeId === "sht40-input") {
    return (
      <SHT40DataViewer
        sample={deck.sht40}
        samplingIntervalMs={deck.samplingIntervalMs.sht40}
        variant="environment"
      />
    );
  }
  if (nodeId === "sht40-tap-humidity") {
    return (
      <SHT40DataViewer
        sample={deck.sht40}
        samplingIntervalMs={deck.samplingIntervalMs.sht40}
        variant="humidity"
      />
    );
  }
  if (nodeId === "sht40-tap-temp") {
    return (
      <SHT40DataViewer
        sample={deck.sht40}
        samplingIntervalMs={deck.samplingIntervalMs.sht40}
        variant="temperature"
      />
    );
  }

  if (isStudioSensorTapNodeId(nodeId)) {
    return null;
  }

  return null;
}
