import { AdbContext, CrudProviderContext } from "../provider";
import { type ComponentType, type ReactNode } from "react";
import { ContextScope } from "./ContextScope";
import { resolveGraviolaContext } from "./registry";
import { GRAVIOLA_CONTEXT_IRI_PROP } from "./types";

export type WithGraviolaContextProps = {
  [GRAVIOLA_CONTEXT_IRI_PROP]?: string;
};

export function withGraviolaContext<P extends WithGraviolaContextProps>(
  Component: ComponentType<P>,
): ComponentType<P> {
  function WithGraviolaContextWrapper(props: P) {
    const contextIRI = props[GRAVIOLA_CONTEXT_IRI_PROP];

    if (!contextIRI) {
      return <Component {...props} />;
    }

    const descriptor = resolveGraviolaContext(contextIRI);
    if (!descriptor) {
      return <Component {...props} />;
    }

    let tree: ReactNode = (
      <ContextScope contextIRI={contextIRI}>
        <Component {...props} />
      </ContextScope>
    );

    if (descriptor.adb) {
      tree = (
        <AdbContext.Provider value={descriptor.adb}>{tree}</AdbContext.Provider>
      );
    }

    return (
      <CrudProviderContext.Provider value={descriptor.crud}>
        {tree}
      </CrudProviderContext.Provider>
    );
  }

  WithGraviolaContextWrapper.displayName = `withGraviolaContext(${Component.displayName || Component.name || "Component"})`;

  return WithGraviolaContextWrapper;
}
