import { bitstreamStudioChapter } from "./bitstream-studio/chapter";
import { bmi270Chapter } from "./bmi270/chapter";
import { eulerQuaternionChapter } from "./euler-quaternion/chapter";
import { bmm350Chapter } from "./bmm350/chapter";
import { dps368Chapter } from "./dps368/chapter";
import { sht40Chapter } from "./sht40/chapter";
import type { ChapterDefinition, SlideDefinition } from "./types";

export const chapters: ChapterDefinition[] = [
  bitstreamStudioChapter,
  bmi270Chapter,
  eulerQuaternionChapter,
  bmm350Chapter,
  dps368Chapter,
  sht40Chapter,
].sort((a, b) => a.order - b.order);

export type FlatSlide = SlideDefinition & {
  chapterId: string;
  chapterTitle: string;
  flatIndex: number;
};

export const flatSlides: FlatSlide[] = chapters.flatMap((chapter) =>
  chapter.slides.map((slide, index) => ({
    ...slide,
    chapterId: chapter.id,
    chapterTitle: chapter.title,
    flatIndex: 0,
  })),
).map((slide, flatIndex) => ({ ...slide, flatIndex }));
