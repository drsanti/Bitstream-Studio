import type { MarkdownReadHeightMode } from "../schemas/markdownReadHeight";
import { CourseBlockReadHeightField } from "./CourseBlockReadHeightField";

export function CourseMarkdownReadHeightField({
  blockId,
  readHeight,
}: {
  blockId: string;
  readHeight?: MarkdownReadHeightMode;
}) {
  return (
    <CourseBlockReadHeightField blockId={blockId} readHeight={readHeight} variant="markdown" />
  );
}
