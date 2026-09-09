import {
  MarkdownPreviewProps,
  MarkdownPreviewRef,
} from "@uiw/react-markdown-preview";
import type { ContextStore, MDEditorProps } from "@uiw/react-md-editor";
import {
  lazy,
  Suspense,
  type ComponentType,
  type RefAttributes,
} from "react";

/**
 * Lazy-load `@uiw/react-md-editor` so CSS/side-effects stay out of the
 * critical path. Works in Vite and other non-Next bundlers
 * (replaces the previous `next/dynamic` wrapper).
 * @see https://github.com/uiwjs/react-md-editor/issues/52
 */
const LazyMDEditor = lazy(() =>
  import("@uiw/react-md-editor").then((mod) => ({
    default: mod.default as unknown as ComponentType<
      MDEditorProps & RefAttributes<ContextStore>
    >,
  })),
);

const LazyMDEditorMarkdown = lazy(() =>
  import("@uiw/react-md-editor").then((mod) => ({
    default: mod.default.Markdown as unknown as ComponentType<
      MarkdownPreviewProps & RefAttributes<MarkdownPreviewRef>
    >,
  })),
);

const MDEditor: ComponentType<MDEditorProps & RefAttributes<ContextStore>> = (
  props,
) => (
  <Suspense fallback={null}>
    <LazyMDEditor {...props} />
  </Suspense>
);

export const MDEditorMarkdown: ComponentType<
  MarkdownPreviewProps & RefAttributes<MarkdownPreviewRef>
> = (props) => (
  <Suspense fallback={null}>
    <LazyMDEditorMarkdown {...props} />
  </Suspense>
);

export default MDEditor;
