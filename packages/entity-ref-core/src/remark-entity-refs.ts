import type { Link, PhrasingContent, Root, Text } from "mdast";
import { visit } from "unist-util-visit";

import { isGraviolaUri, parseGraviolaUri } from "./uri";
import { WIKILINK_PATTERN } from "./wikilink";
import type { EntityRef } from "./types";

export const GRAVIOLA_LINK_DATA_KEY = "graviolaEntityRef";

type LinkData = {
  hProperties?: Record<string, string>;
  [GRAVIOLA_LINK_DATA_KEY]?: EntityRef;
};

function wikilinkToLink(label: string, url: string): Link {
  return {
    type: "link",
    url,
    title: null,
    children: [{ type: "text", value: label || url }],
    data: {
      hProperties: { "data-graviola-ref": "true" },
    } satisfies LinkData,
  };
}

function splitTextForWikilinks(value: string): PhrasingContent[] | null {
  WIKILINK_PATTERN.lastIndex = 0;
  if (!WIKILINK_PATTERN.test(value)) {
    return null;
  }
  WIKILINK_PATTERN.lastIndex = 0;

  const nodes: PhrasingContent[] = [];
  let lastIndex = 0;

  for (const match of value.matchAll(WIKILINK_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      nodes.push({ type: "text", value: value.slice(lastIndex, index) });
    }

    const target = match[1];
    const label = match[2] ?? target;
    const typeColon = target.indexOf(":");
    const viewSuffix = match[3]?.startsWith("view=") ? `?${match[3]}` : "";
    const url =
      target.startsWith("http://") || target.startsWith("https://")
        ? `graviola:${target.split("/").pop() ?? target}/${target.split("/").pop() ?? target}`
        : typeColon > 0
          ? `graviola:${target.slice(0, typeColon)}/${target.slice(typeColon + 1)}${viewSuffix}`
          : `graviola:_/${target}${viewSuffix}`;

    nodes.push(wikilinkToLink(label, url));
    lastIndex = index + match[0].length;
  }

  if (lastIndex < value.length) {
    nodes.push({ type: "text", value: value.slice(lastIndex) });
  }

  return nodes.length > 0 ? nodes : null;
}

/**
 * Remark plugin: normalize wikilinks to graviola scheme links and tag graviola URIs.
 */
export function remarkEntityRefs() {
  return (tree: Root) => {
    visit(tree, "text", (node: Text, index, parent) => {
      if (!parent || index == null || typeof index !== "number") return;
      const replacement = splitTextForWikilinks(node.value);
      if (!replacement) return;
      (parent.children as PhrasingContent[]).splice(index, 1, ...replacement);
    });

    visit(tree, "link", (node: Link) => {
      if (!isGraviolaUri(node.url)) return;
      const ref = parseGraviolaUri(node.url);
      const data = (node.data ?? {}) as LinkData;
      data.hProperties = {
        ...data.hProperties,
        "data-graviola-ref": "true",
      };
      if (ref) {
        data[GRAVIOLA_LINK_DATA_KEY] = ref;
      }
      node.data = data;
    });
  };
}
