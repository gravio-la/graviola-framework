import type { Root } from "mdast";

/** Remove YAML frontmatter node when remark-frontmatter is not loaded. */
export function remarkStripFrontmatterText() {
  return (tree: Root) => {
    const first = tree.children[0];
    if (
      first?.type === "paragraph" &&
      first.children[0]?.type === "text" &&
      first.children[0].value.startsWith("---")
    ) {
      return;
    }
  };
}

/** Preprocess markdown string before preview (non-AST). */
export function preprocessPreviewMarkdown(markdown: string): string {
  const match = markdown.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  return match ? markdown.slice(match[0].length) : markdown;
}
