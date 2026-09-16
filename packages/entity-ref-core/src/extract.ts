import uniqBy from "lodash-es/uniqBy";

import { parseGraviolaUri, isGraviolaUri } from "./uri";
import { parseWikilink, WIKILINK_PATTERN } from "./wikilink";
import type { EntityRef } from "./types";
import { stripFrontmatter } from "./frontmatter";

const MARKDOWN_LINK_RE = /\[([^\]]*)\]\((graviola:[^)]+)\)/g;

/** Scan markdown for all entity references (links + wikilinks). */
export function extractEntityRefs(markdown: string): EntityRef[] {
  const body = stripFrontmatter(markdown);
  const refs: EntityRef[] = [];

  for (const match of body.matchAll(MARKDOWN_LINK_RE)) {
    const href = match[2];
    if (!isGraviolaUri(href)) continue;
    const parsed = parseGraviolaUri(href);
    if (parsed) {
      refs.push({
        ...parsed,
        label: parsed.label ?? (match[1] || undefined),
      });
    }
  }

  WIKILINK_PATTERN.lastIndex = 0;
  for (const match of body.matchAll(WIKILINK_PATTERN)) {
    const segments = [match[1], match[2], match[3]].filter(
      (s): s is string => s != null && s !== "",
    );
    const parsed = parseWikilink(segments.join("|"));
    if (parsed) {
      refs.push(parsed);
    }
  }

  return uniqBy(
    refs,
    (r) =>
      `${r.entityIRI ?? ""}:${r.typeName ?? ""}:${r.entityId}:${r.view ?? ""}`,
  );
}
