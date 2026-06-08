import { usePresentationBmm350 } from "../../../../app/usePresentationSensor";
import { DemoSlideLayout } from "../../../_shared/layouts/DemoSlideLayout";
import { ValueDisplay } from "../../../../widgets/ValueDisplay";
import { LiveBar } from "../../../../widgets/LiveBar";

export default function BmmDemoVectorSlide() {
  const frame = usePresentationBmm350();

  return (
    <DemoSlideLayout
      layout="grid-2x3"
      title="Magnetic vector"
      subtitle="Live Bx, By, Bz from Bitstream Studio — compare |B| to Earth's field."
      theoryStrip="µT tri-axis vector in the sensor frame; magnitude √(Bx² + By² + Bz²)."
      footer={
        frame.hasSample
          ? frame.magValid
            ? `|B| = ${frame.magnitude.toFixed(2)} µT`
            : "Enable MAG in BMM350 publish mask"
          : "No BMM350 sample — start bridge + route telemetry"
      }
    >
      <ValueDisplay label="Bx" value={frame.magValid ? frame.bx : NaN} unit="µT" color="var(--axis-x)" decimals={2} />
      <ValueDisplay label="By" value={frame.magValid ? frame.by : NaN} unit="µT" color="var(--axis-y)" decimals={2} />
      <ValueDisplay label="Bz" value={frame.magValid ? frame.bz : NaN} unit="µT" color="var(--axis-z)" decimals={2} />
      <div
        className="flex flex-col justify-center gap-3 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] p-4"
        style={{ gridColumn: "1 / -1" }}
      >
        <ValueDisplay
          label="|B|"
          value={frame.magValid ? frame.magnitude : NaN}
          unit="µT"
          color="var(--accent-green)"
          decimals={2}
        />
        <LiveBar
          label="Magnitude vs Earth field"
          value={frame.magValid ? frame.magnitude : 0}
          min={0}
          max={80}
          color="var(--accent-green)"
          showValue
          unit="µT"
          decimals={1}
        />
      </div>
    </DemoSlideLayout>
  );
}
