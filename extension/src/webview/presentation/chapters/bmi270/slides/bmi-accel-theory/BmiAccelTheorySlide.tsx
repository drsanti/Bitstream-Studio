import { TheorySlideLayout } from "../../../_shared/layouts/TheorySlideLayout";

import { TheoryBulletList } from "../../../_shared/components/TheoryBulletList";

import { PresentationCourseDiagramEmbed } from "../../../../components/PresentationCourseDiagramEmbed";



export default function BmiAccelTheorySlide() {

  return (

    <TheorySlideLayout

      eyebrow="Accelerometer"

      title="Specific force, not velocity"

      subtitle="The accelerometer reports how strongly the proof mass is pushed — in units of g."

      visualLabel="Proof mass · live"

      visualAccent="amber"

      visual={<PresentationCourseDiagramEmbed diagramId="pilot-bmi-accel-mems" />}

    >

      <TheoryBulletList

        accent="var(--axis-x)"

        items={[

          "At rest on a table: support reaction ≈ +1 g upward → aZ ≈ +1 g.",

          "Free fall (no contact): net specific force → |a| ≈ 0 g on all axes.",

          "Dynamic motion adds transients on top of the gravity vector.",

          "Full-scale ranges (±2/4/8/16 g) trade resolution for headroom.",

        ]}

      />

    </TheorySlideLayout>

  );

}

