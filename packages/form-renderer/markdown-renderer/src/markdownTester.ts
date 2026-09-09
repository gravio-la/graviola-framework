import {
  and,
  formatIs,
  isStringControl,
  optionIs,
  or,
  rankWith,
  type RankedTester,
} from "@jsonforms/core";

/**
 * Matches string controls whose schema `format` is `"markdown"` or whose
 * uiSchema options include `markdown: true`.
 */
export const markdownTester: RankedTester = rankWith(
  10,
  and(
    isStringControl,
    or(formatIs("markdown"), optionIs("markdown", true)),
  ),
);
