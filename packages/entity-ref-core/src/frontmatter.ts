import { parse as parseYaml } from "yaml";

import type { DocumentBinding } from "./types";

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/** Split YAML frontmatter from markdown body (Mode A standalone documents). */
export function splitFrontmatter(markdown: string): {
  frontmatter: DocumentBinding | null;
  body: string;
} {
  const match = markdown.match(FRONTMATTER_RE);
  if (!match) {
    return { frontmatter: null, body: markdown };
  }

  let frontmatter: DocumentBinding | null = null;
  try {
    const parsed = parseYaml(match[1]);
    if (parsed && typeof parsed === "object") {
      frontmatter = parsed as DocumentBinding;
    }
  } catch {
    frontmatter = null;
  }

  return {
    frontmatter,
    body: markdown.slice(match[0].length),
  };
}

/** Return markdown without the YAML header. */
export function stripFrontmatter(markdown: string): string {
  return splitFrontmatter(markdown).body;
}
