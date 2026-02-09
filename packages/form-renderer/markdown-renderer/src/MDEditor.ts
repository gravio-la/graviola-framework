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
    () => {
      const promise:
        | Promise<
            ForwardRefExoticComponent<
              MDEditorProps & RefAttributes<ContextStore>
            > & {
              Markdown: ForwardRefExoticComponent<
                MarkdownPreviewProps & RefAttributes<MarkdownPreviewRef>
              >;
            }
          >
        | LoaderComponent<MDEditorProps & RefAttributes<ContextStore>> =
        import("@uiw/react-md-editor").then((mod) => mod.default);
      return promise;
    },
    { ssr: false },
  );
export const MDEditorMarkdown: ComponentType<
  MarkdownPreviewProps & RefAttributes<MarkdownPreviewRef>
> = dynamic(
  () => {
    const promise: Promise<
      React.ForwardRefExoticComponent<
        MarkdownPreviewProps & RefAttributes<MarkdownPreviewRef>
      >
    > = import("@uiw/react-md-editor").then((mod) => mod.default.Markdown);
    return promise;
  },
  { ssr: false },
);

export default MDEditor;
