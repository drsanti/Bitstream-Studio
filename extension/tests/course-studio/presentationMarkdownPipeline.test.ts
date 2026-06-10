import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  COURSE_MARKDOWN_MATH_DELIMITERS,
  COURSE_MARKDOWN_MATH_STANDARD,
  COURSE_MARKDOWN_MATH_STATUS_LABEL,
  isPresentationMathCodeClass,
  presentationRehypePlugins,
  presentationRemarkPlugins,
} from "../../src/webview/presentation/shared/presentationMarkdownPipeline";

describe("presentationMarkdownPipeline", () => {
  it("declares StackEdit/Obsidian KaTeX standard", () => {
    assert.equal(COURSE_MARKDOWN_MATH_STANDARD, "stackedit-obsidian-katex");
    assert.equal(COURSE_MARKDOWN_MATH_DELIMITERS.inline, "$…$");
    assert.equal(COURSE_MARKDOWN_MATH_DELIMITERS.block, "$$…$$");
    assert.match(COURSE_MARKDOWN_MATH_STATUS_LABEL, /KaTeX/);
  });

  it("registers gfm + math remark and katex rehype plugins", () => {
    const remark = presentationRemarkPlugins();
    const rehype = presentationRehypePlugins();
    assert.equal(remark.length, 2);
    assert.equal(rehype.length, 1);
    assert.deepEqual((remark[1] as [unknown, { singleDollarTextMath: boolean }])[1], {
      singleDollarTextMath: true,
    });
  });

  it("detects math code classes for component passthrough", () => {
    assert.equal(isPresentationMathCodeClass("language-math math-display"), true);
    assert.equal(isPresentationMathCodeClass("language-typescript"), false);
  });
});
