import {
  and,
  formatIs,
  isControl,
  isStringControl,
  optionIs,
  or,
  rankWith,
} from "@graviola/edb-detail-renderer-core";
import type { Tester } from "@jsonforms/core";
import type { ControlElement } from "@jsonforms/core";
import type { JSONSchema7 } from "json-schema";

function contentMediaTypeIsMarkdown(_u: unknown, schema: unknown): boolean {
  const s = schema as JSONSchema7 | undefined;
  return s?.contentMediaType === "text/markdown";
}

const detailOptionMarkdown: Tester = (uischema) => {
  const opts = (uischema as ControlElement | undefined)?.options;
  if (!opts || typeof opts !== "object") return false;
  if (opts.markdown === true) return true;
  const detail = opts.detail;
  if (detail && typeof detail === "object" && !Array.isArray(detail)) {
    const dOpts = (detail as { options?: Record<string, unknown> }).options;
    if (dOpts?.markdown === true) return true;
  }
  return false;
};

export const markdownValueTester = rankWith(
  6,
  and(
    isStringControl,
    or(
      contentMediaTypeIsMarkdown,
      formatIs("markdown"),
      optionIs("markdown", true),
      detailOptionMarkdown,
    ),
  ),
);

/** Control-level tester for structural dispatch (string controls with markdown hints). */
export const markdownControlTester = rankWith(
  6,
  and(
    isControl,
    isStringControl,
    or(
      contentMediaTypeIsMarkdown,
      formatIs("markdown"),
      optionIs("markdown", true),
      detailOptionMarkdown,
    ),
  ),
);
