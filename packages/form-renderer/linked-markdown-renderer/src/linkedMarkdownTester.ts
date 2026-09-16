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
 * Matches markdown string controls with `entityLinking: true` in uiSchema options.
 * Ranks above the plain markdown renderer (10).
 */
export const linkedMarkdownTester: RankedTester = rankWith(
  15,
  and(
    isStringControl,
    or(formatIs("markdown"), optionIs("markdown", true)),
    optionIs("entityLinking", true),
  ),
);
