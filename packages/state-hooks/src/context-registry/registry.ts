import type { ContextDescriptor, RegisteredContext } from "./types";

const registry = new Map<string, ContextDescriptor>();

export function registerGraviolaContext(
  iri: string,
  descriptor: ContextDescriptor,
): () => void {
  if (registry.has(iri)) {
    // eslint-disable-next-line no-console
    console.warn(
      `[GraviolaContextRegistry] duplicate registration for "${iri}"`,
    );
  }
  registry.set(iri, descriptor);
  return () => {
    if (registry.get(iri) === descriptor) {
      registry.delete(iri);
    }
  };
}

export function resolveGraviolaContext(
  iri: string,
): ContextDescriptor | undefined {
  const descriptor = registry.get(iri);
  if (!descriptor) {
    const registered = Array.from(registry.keys());
    // eslint-disable-next-line no-console
    console.warn(
      `[GraviolaContextRegistry] unknown context IRI "${iri}". Registered IRIs: ${
        registered.length ? registered.join(", ") : "(none)"
      }`,
    );
  }
  return descriptor;
}

export function listGraviolaContexts(): RegisteredContext[] {
  return Array.from(registry.entries()).map(([iri, descriptor]) => ({
    iri,
    ...descriptor,
  }));
}
