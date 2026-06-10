import { AlignLeft, PanelTop, Sparkles } from "lucide-react";
import type { PageBlockV1 } from "../schemas/page.v1";
import { CARD_BLOCK_COLOR_THEME_DEFAULTS } from "../schemas/cardBlockColors";
import { CardColorsCard } from "./CourseCardBlockColorsCard";
import { CourseEmojiTextField } from "./CourseEmojiTextField";
import { CourseInspectorCard, COURSE_INSPECTOR_CARD_ICON_CLASS } from "./CourseInspectorCard";
import { CourseTitleIconAnimationFields } from "./inspector/CourseTitleIconAnimationFields";
import { CourseTitleIconField } from "./inspector/CourseTitleIconField";
import { useCoursePageEditorStore } from "./useCoursePageEditorStore";

export function CourseCardBlockInspectorFields({
  block,
}: {
  block: Extract<PageBlockV1, { kind: "card" }>;
}) {
  const updateBlock = useCoursePageEditorStore((s) => s.updateBlock);
  const defaultIconColorHex = CARD_BLOCK_COLOR_THEME_DEFAULTS.icon;
  const effectiveIconColor = block.colors?.icon;
  const animationPeakColorHex = effectiveIconColor ?? defaultIconColorHex;

  return (
    <>
      <CourseInspectorCard
        id={`${block.id}-card-header`}
        title="Header"
        titleIcon={<PanelTop className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
        hint="Card title row — title text, prefix icon, and icon color."
        defaultExpanded
      >
        <div className="flex flex-col gap-2">
          <CourseEmojiTextField
            id={`${block.id}-title`}
            label="Title"
            value={block.title ?? ""}
            onChange={(title) => updateBlock(block.id, { title })}
          />
          <CourseTitleIconField
            blockId={block.id}
            id={`${block.id}-title-icon`}
            icon={block.icon}
            mode="optional"
            iconAnimation={block.iconAnimation}
            colorTarget={{ kind: "card", colors: block.colors }}
            defaultIconColorHex={defaultIconColorHex}
            hint="Shown left of the title in the card header."
            showAnimation={false}
          />
        </div>
      </CourseInspectorCard>

      <CourseInspectorCard
        id={`${block.id}-card-header-animation`}
        title="Header animation"
        titleIcon={<Sparkles className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
        hint="GSAP motion and color on the prefix icon. Respects prefers-reduced-motion."
        defaultExpanded={false}
      >
        <CourseTitleIconAnimationFields
          blockId={block.id}
          iconAnimation={block.iconAnimation}
          defaultPeakColorHex={animationPeakColorHex}
        />
      </CourseInspectorCard>

      <CourseInspectorCard
        id={`${block.id}-card-body`}
        title="Body"
        titleIcon={<AlignLeft className={COURSE_INSPECTOR_CARD_ICON_CLASS} aria-hidden />}
        hint="Card body copy — paragraphs or bullet lists."
        defaultExpanded
      >
        <CourseEmojiTextField
          id={`${block.id}-body`}
          label="Body"
          multiline
          rows={6}
          value={block.body}
          onChange={(body) => updateBlock(block.id, { body })}
        />
      </CourseInspectorCard>

      <CardColorsCard block={block} />
    </>
  );
}
