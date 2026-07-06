import type { Link, Root } from "mdast";

function visitLinks(
  node: Root | Link["children"][number],
  fn: (link: Link) => void,
) {
  if (!node || typeof node !== "object" || !("type" in node)) return;

  if (node.type === "link") {
    fn(node as Link);
  }

  if ("children" in node && Array.isArray(node.children)) {
    for (const child of node.children) {
      visitLinks(child, fn);
    }
  }
}

/**
 * Rewrite bare `?path=` MDX markdown links to `./?path=` so they resolve to the
 * manager shell instead of iframe.html when docs render in the preview iframe.
 */
export function remarkStorybookLinks() {
  return (tree: Root) => {
    visitLinks(tree, (node) => {
      if (typeof node.url !== "string") return;

      if (node.url.startsWith("?path=")) {
        node.url = `./${node.url}`;
        return;
      }

      if (node.url.startsWith("./index.html?path=")) {
        node.url = node.url.replace("./index.html?path=", "./?path=");
      }
    });
  };
}
