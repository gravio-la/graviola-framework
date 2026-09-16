import { remarkEntityRefs, splitFrontmatter } from "@graviola/entity-ref-core";
import { MDEditorMarkdown } from "@graviola/edb-markdown-renderer";
import type { MarkdownPreviewProps } from "@uiw/react-markdown-preview";
import rehypeExternalLinks from "rehype-external-links";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { useMemo } from "react";

import { createLinkedMdPreviewComponents } from "./linkedMdComponents";
import { parseEntityEmbedView } from "./LinkedMdPreviewContext";

export type LinkedMdPreviewProps = {
  source: string;
  /** When true, YAML frontmatter is stripped before render (Mode A). */
  stripBindings?: boolean;
  className?: string;
};

export function LinkedMdPreview({
  source,
  stripBindings = true,
  className,
}: LinkedMdPreviewProps) {
  const { frontmatter, body } = splitFrontmatter(source);
  const displaySource = stripBindings ? body : source;
  const defaultView =
    parseEntityEmbedView(frontmatter?.defaultView) ?? "inline";

  const previewComponents = useMemo(
    () => createLinkedMdPreviewComponents(defaultView),
    [defaultView],
  );

  const rehypePlugins = useMemo(() => {
    const schema = {
      ...defaultSchema,
      protocols: {
        ...defaultSchema.protocols,
        href: [...(defaultSchema.protocols?.href ?? []), "graviola"],
      },
    };
    return [
      [rehypeSanitize, schema],
      [rehypeExternalLinks, { target: "_blank" }],
    ];
  }, []);

  return (
    <MDEditorMarkdown
      className={className}
      source={displaySource}
      remarkPlugins={[remarkEntityRefs]}
      rehypePlugins={rehypePlugins as MarkdownPreviewProps["rehypePlugins"]}
      components={previewComponents}
      wrapperElement={{ "data-color-mode": "light" }}
    />
  );
}
