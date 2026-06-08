import type { SlideBackdropAccent } from "./SlideBackdrop";

export function chapterBackdropAccent(chapterId: string): SlideBackdropAccent {
  if (chapterId === "bmi270") {
    return "amber";
  }
  if (chapterId === "euler-quaternion") {
    return "purple";
  }
  if (chapterId === "bmm350") {
    return "green";
  }
  return "cyan";
}
