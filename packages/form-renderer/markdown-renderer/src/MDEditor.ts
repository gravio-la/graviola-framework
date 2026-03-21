import {
  MarkdownPreviewProps,
  MarkdownPreviewRef,
} from "@uiw/react-markdown-preview";
import type { ContextStore, MDEditorProps } from "@uiw/react-md-editor";
import dynamic, { LoaderComponent } from "next/dynamic";
import type {
  ForwardRefExoticComponent,
  RefAttributes,
  ComponentType,
} from "react";
/**
 * this dynamic import  is necessary due to https://github.com/uiwjs/react-md-editor/issues/52
 * @see https://err.sh/next.js/css-npm
 */
const MDEditor: ComponentType<MDEditorProps & RefAttributes<ContextStore>> =
  dynamic(
    () =>
      import("@uiw/react-md-editor").then(
        (mod) =>
          mod.default as unknown as ComponentType<
            MDEditorProps & RefAttributes<ContextStore>
          >,
      ),
    { ssr: false },
  ) as ComponentType<MDEditorProps & RefAttributes<ContextStore>>;

export const MDEditorMarkdown: ComponentType<
  MarkdownPreviewProps & RefAttributes<MarkdownPreviewRef>
> = dynamic(
  () =>
    import("@uiw/react-md-editor").then(
      (mod) =>
        mod.default.Markdown as unknown as ComponentType<
          MarkdownPreviewProps & RefAttributes<MarkdownPreviewRef>
        >,
    ),
  { ssr: false },
) as ComponentType<MarkdownPreviewProps & RefAttributes<MarkdownPreviewRef>>;

export default MDEditor;
