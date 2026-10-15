import {
  and,
  formatIs,
  isControl,
  isStringControl,
  rankWith,
  schemaMatches,
  type RankedTester,
} from "@jsonforms/core";
import type { JSONSchema7 } from "json-schema";

/** Above default material string control (rank 1). */
export const IMAGE_URL_TESTER_RANK = 5;

export const imageUrlTester: RankedTester = rankWith(
  IMAGE_URL_TESTER_RANK,
  and(
    isControl,
    isStringControl,
    formatIs("uri"),
    schemaMatches((schema) => {
      const cmt = (schema as JSONSchema7).contentMediaType;
      return typeof cmt === "string" && cmt.startsWith("image/");
    }),
  ),
);
