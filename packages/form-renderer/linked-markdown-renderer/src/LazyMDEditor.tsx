import type { ContextStore, MDEditorProps } from "@uiw/react-md-editor";
import { lazy, Suspense, type ComponentType, type RefAttributes } from "react";

const LazyMDEditor = lazy(() =>
  import("@uiw/react-md-editor").then((mod) => ({
    default: mod.default as unknown as ComponentType<
      MDEditorProps & RefAttributes<ContextStore>
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

export default MDEditor;
